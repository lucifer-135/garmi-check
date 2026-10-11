import json
import unittest

from heat import (avoid_windows, body_band, summarize_day, summarize_reading,
                  thermometer_view, wet_bulb_c)


class WetBulbTest(unittest.TestCase):
    def test_solapur_matches_article(self):
        # Down To Earth, 28 Mar 2024: 40 C at 53 % gives 31.54 C wet-bulb.
        self.assertAlmostEqual(wet_bulb_c(40, 53), 31.54, delta=0.05)

    def test_jalgaon_matches_article(self):
        # Down To Earth, 28 Mar 2024: 46.8 C at 29 % gives 30.72 C wet-bulb.
        self.assertAlmostEqual(wet_bulb_c(46.8, 29), 30.72, delta=0.05)

    def test_humid_town_beats_hotter_dry_town(self):
        self.assertGreater(wet_bulb_c(40, 53), wet_bulb_c(46.8, 29))

    def test_rh_is_clamped_to_valid_range(self):
        self.assertEqual(wet_bulb_c(30, 100), wet_bulb_c(30, 99))
        self.assertEqual(wet_bulb_c(30, 1), wet_bulb_c(30, 5))


class BandTest(unittest.TestCase):
    def test_band_edges(self):
        self.assertEqual(body_band(29.9), "lower")
        self.assertEqual(body_band(30.0), "high")
        self.assertEqual(body_band(34.9), "high")
        self.assertEqual(body_band(35.0), "extreme")


class ThermometerTest(unittest.TestCase):
    def test_jalgaon_is_heatwave_by_temperature(self):
        self.assertEqual(thermometer_view(46.8, "plains")["verdict"], "heatwave_by_temp")

    def test_solapur_only_meets_threshold(self):
        self.assertEqual(thermometer_view(40, "plains")["verdict"], "meets_threshold")

    def test_region_thresholds(self):
        self.assertEqual(thermometer_view(36.9, "coastal")["verdict"], "below_threshold")
        self.assertEqual(thermometer_view(37, "coastal")["verdict"], "meets_threshold")
        self.assertEqual(thermometer_view(30, "hills")["verdict"], "meets_threshold")
        self.assertEqual(thermometer_view(39.9, "plains")["verdict"], "below_threshold")

    def test_unknown_region_falls_back_to_plains(self):
        self.assertEqual(thermometer_view(39, "desert")["threshold_c"], 40.0)


def _hour(h, band):
    return {"time": f"2026-10-12T{h:02d}:00", "band": band}


class AvoidWindowsTest(unittest.TestCase):
    def test_merges_consecutive_risky_hours(self):
        hours = [_hour(11, "lower"), _hour(12, "high"), _hour(13, "extreme"),
                 _hour(14, "high"), _hour(15, "high"), _hour(16, "lower")]
        self.assertEqual(avoid_windows(hours),
                         [{"from": "12:00", "to": "16:00", "band": "extreme"}])

    def test_splits_separate_windows(self):
        hours = [_hour(10, "high"), _hour(11, "lower"), _hour(12, "high")]
        self.assertEqual(avoid_windows(hours),
                         [{"from": "10:00", "to": "11:00", "band": "high"},
                          {"from": "12:00", "to": "13:00", "band": "high"}])

    def test_gap_in_time_splits_window(self):
        hours = [_hour(10, "high"), _hour(12, "high")]
        self.assertEqual(len(avoid_windows(hours)), 2)

    def test_null_hours_break_windows(self):
        hours = [_hour(10, "high"), _hour(11, None), _hour(12, "high")]
        self.assertEqual(len(avoid_windows(hours)), 2)

    def test_no_risky_hours(self):
        self.assertEqual(avoid_windows([_hour(12, "lower")]), [])


class SummaryTest(unittest.TestCase):
    def test_summarize_day_filters_by_date_and_handles_nulls(self):
        times = ["2026-10-12T12:00", "2026-10-12T13:00", "2026-10-13T12:00"]
        day = summarize_day("2026-10-12", times, [38.0, None, 50.0], [70, 70, 90], "coastal")
        self.assertEqual(len(day["hours"]), 2)
        self.assertIsNone(day["hours"][1]["wbt_c"])
        self.assertEqual(day["thermometer"]["verdict"], "meets_threshold")
        self.assertEqual(day["body"]["band"], "high")
        self.assertEqual(day["body"]["at"], "12:00")
        self.assertEqual(day["avoid"], [{"from": "12:00", "to": "13:00", "band": "high"}])

    def test_summarize_day_all_null(self):
        day = summarize_day("2026-10-12", ["2026-10-12T12:00"], [None], [None], "plains")
        self.assertIsNone(day["thermometer"])
        self.assertIsNone(day["body"])

    def test_summarize_reading(self):
        r = summarize_reading(40, 53, "plains")
        self.assertEqual(r["body"]["max_wbt_c"], 31.5)
        self.assertEqual(r["body"]["band"], "high")


class AlertTest(unittest.TestCase):
    def test_subject_is_ascii_and_short(self):
        from alerts import build_alert
        from cities import CITIES
        city = CITIES[2]  # Visakhapatnam, the longest name
        times = [f"2024-05-30T{h:02d}:00" for h in range(10, 16)]
        day = summarize_day("2024-05-30", times, [36.3] * 6, [75, 75, 50, 75, 75, 75], "coastal")
        subject, message = build_alert(city, day, "2024-05-30")
        subject.encode("ascii")
        self.assertLess(len(subject), 100)
        self.assertIn("Avoid heavy work between: 10:00–12:00, 13:00–16:00", message)
        self.assertIn("would not flag this day", message)


class RetryTest(unittest.TestCase):
    def _run(self, outcomes):
        import io
        from unittest import mock
        from urllib.error import HTTPError
        import app
        calls = []

        def fake_urlopen(url, timeout):
            calls.append(url)
            o = outcomes[len(calls) - 1]
            if isinstance(o, int):
                raise HTTPError(url, o, "err", {}, io.BytesIO(b'{"reason": "x"}'))
            return io.BytesIO(json.dumps(o).encode())

        with mock.patch.object(app, "urlopen", fake_urlopen), mock.patch.object(app.time, "sleep"):
            try:
                return app._get_json("http://x"), len(calls)
            except app.ApiError as e:
                return e, len(calls)

    def test_retries_overload_then_succeeds(self):
        result, n = self._run([503, 503, {"ok": 1}])
        self.assertEqual((result, n), ({"ok": 1}, 3))

    def test_gives_up_after_three_attempts(self):
        result, n = self._run([503, 429, 502])
        self.assertEqual((result.status, n), (502, 3))

    def test_does_not_retry_bad_request(self):
        result, n = self._run([400])
        self.assertEqual((result.status, n), (502, 1))


if __name__ == "__main__":
    unittest.main()
