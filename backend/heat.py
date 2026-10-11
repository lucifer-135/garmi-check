"""Heat-stress logic for Garmi Check. Standard library only.

Wet-bulb temperature uses Stull (2011), valid for RH 5-99 % and -20 to 50 C,
with an error of about -1 to +0.65 C. Treat every number as an estimate.
"""
from datetime import datetime, timedelta
from math import atan, sqrt

# Commonly cited wet-bulb limits (indicative, not medical thresholds).
HIGH_WBT_C = 30.0
EXTREME_WBT_C = 35.0

# IMD temperature thresholds for declaring a heatwave.
REGION_THRESHOLDS_C = {"plains": 40.0, "coastal": 37.0, "hills": 30.0}
AUTO_HEATWAVE_C = 45.0

RISKY_BANDS = ("high", "extreme")
BAND_RANK = {"lower": 0, "high": 1, "extreme": 2}


def wet_bulb_c(t_c: float, rh: float) -> float:
    """Stull (2011) wet-bulb temperature in C. t_c in C, rh in %.

    RH is clamped to the formula's valid range (5-99 %).
    """
    rh = min(max(rh, 5.0), 99.0)
    return (t_c * atan(0.151977 * sqrt(rh + 8.313659))
            + atan(t_c + rh) - atan(rh - 1.676331)
            + 0.00391838 * rh ** 1.5 * atan(0.023101 * rh)
            - 4.686035)


def body_band(wbt_c: float) -> str:
    """lower below 30 C, high from 30 to below 35 C, extreme at 35 C and above."""
    if wbt_c >= EXTREME_WBT_C:
        return "extreme"
    if wbt_c >= HIGH_WBT_C:
        return "high"
    return "lower"


def thermometer_view(max_temp_c: float, region: str) -> dict:
    """What a temperature-only (IMD-style) reading says about the day.

    The official rule also needs >= 4.5 C above normal, which is not modelled.
    """
    threshold = REGION_THRESHOLDS_C.get(region, REGION_THRESHOLDS_C["plains"])
    if max_temp_c >= AUTO_HEATWAVE_C:
        verdict = "heatwave_by_temp"
    elif max_temp_c >= threshold:
        verdict = "meets_threshold"
    else:
        verdict = "below_threshold"
    return {"max_temp_c": round(max_temp_c, 1), "threshold_c": threshold,
            "auto_c": AUTO_HEATWAVE_C, "verdict": verdict}


def _hhmm(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def avoid_windows(hours: list) -> list:
    """Merge consecutive high/extreme hours into ranges like 12:00-16:00.

    hours: [{"time": "YYYY-MM-DDTHH:MM", "band": ...}, ...] in time order.
    Each hour covers [time, time + 1h). The window's band is its worst hour.
    """
    windows = []
    start = end = None
    worst = None
    for h in hours:
        if h.get("band") not in RISKY_BANDS:
            if start is not None:
                windows.append((start, end, worst))
                start = None
            continue
        t = datetime.fromisoformat(h["time"])
        if start is not None and t == end:
            end = t + timedelta(hours=1)
            if BAND_RANK[h["band"]] > BAND_RANK[worst]:
                worst = h["band"]
        else:
            if start is not None:
                windows.append((start, end, worst))
            start, end, worst = t, t + timedelta(hours=1), h["band"]
    if start is not None:
        windows.append((start, end, worst))
    return [{"from": _hhmm(s), "to": _hhmm(e), "band": b} for s, e, b in windows]


def score_hour(time: str, temp_c, rh) -> dict:
    """One hourly row. Missing temperature or humidity gives a null wet-bulb."""
    if temp_c is None or rh is None:
        return {"time": time, "temp_c": temp_c, "rh": rh, "wbt_c": None, "band": None}
    wbt = round(wet_bulb_c(temp_c, rh), 1)
    return {"time": time, "temp_c": round(temp_c, 1), "rh": round(rh),
            "wbt_c": wbt, "band": body_band(wbt)}


def summarize_day(date: str, times: list, temps: list, rhs: list, region: str) -> dict:
    """Thermometer view, body view, avoid windows and hourly rows for one day."""
    hours = [score_hour(t, tc, rh) for t, tc, rh in zip(times, temps, rhs)
             if t.startswith(date)]
    valid = [h for h in hours if h["wbt_c"] is not None]
    temps_ok = [h["temp_c"] for h in hours if h["temp_c"] is not None]

    thermometer = thermometer_view(max(temps_ok), region) if temps_ok else None
    body = None
    if valid:
        peak = max(valid, key=lambda h: h["wbt_c"])
        body = {"max_wbt_c": peak["wbt_c"], "band": peak["band"],
                "at": peak["time"][11:16], "temp_c": peak["temp_c"], "rh": peak["rh"]}
    return {"date": date, "thermometer": thermometer, "body": body,
            "avoid": avoid_windows(hours), "hours": hours}


def summarize_reading(temp_c: float, rh: float, region: str) -> dict:
    """Single reading (e.g. a cited midday observation) with no hourly data."""
    wbt = round(wet_bulb_c(temp_c, rh), 1)
    return {"thermometer": thermometer_view(temp_c, region),
            "body": {"max_wbt_c": wbt, "band": body_band(wbt),
                     "temp_c": temp_c, "rh": rh}}
