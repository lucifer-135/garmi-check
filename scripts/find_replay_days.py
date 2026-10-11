"""Find peak humid-heat days per preset city from the Open-Meteo archive (ERA5).

Run from the repo root:  python scripts/find_replay_days.py
Archive values are model data, not station readings, so they will not match
the Down To Earth article's Solapur and Jalgaon figures.
"""
import json
import sys
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from heat import summarize_day  # noqa: E402

CITIES = [
    ("Chennai", 13.08, 80.27, "coastal"),
    ("Mumbai", 19.08, 72.88, "coastal"),
    ("Visakhapatnam", 17.69, 83.22, "coastal"),
    ("Kochi", 9.93, 76.27, "coastal"),
    ("Delhi", 28.61, 77.21, "plains"),
    ("Nagpur", 21.15, 79.09, "plains"),
    ("Solapur", 17.66, 75.91, "plains"),
    ("Jalgaon", 21.01, 75.56, "plains"),
]
YEARS = [2024, 2025, 2026]


def fetch(lat, lon, year):
    qs = urlencode({"latitude": lat, "longitude": lon,
                    "start_date": f"{year}-04-01", "end_date": f"{year}-06-30",
                    "hourly": "temperature_2m,relative_humidity_2m",
                    "timezone": "Asia/Kolkata"})
    with urlopen("https://archive-api.open-meteo.com/v1/archive?" + qs, timeout=30) as r:
        h = json.load(r)["hourly"]
    return h["time"], h["temperature_2m"], h["relative_humidity_2m"]


def main():
    out = []
    for name, lat, lon, region in CITIES:
        days = []
        for year in YEARS:
            times, temps, rhs = fetch(lat, lon, year)
            for d in sorted({t[:10] for t in times}):
                s = summarize_day(d, times, temps, rhs, region)
                if s["body"]:
                    days.append(s)
        peak = max(days, key=lambda s: s["body"]["max_wbt_c"])
        # "Gap" day: the thermometer stays below the official threshold but the body band is high.
        gaps = [s for s in days if s["thermometer"]["verdict"] == "below_threshold"]
        gap = max(gaps, key=lambda s: s["body"]["max_wbt_c"]) if gaps else None
        for label, s in (("peak", peak), ("gap", gap)):
            if s:
                print(f"{name:14} {label:4} {s['date']}  temp max {s['thermometer']['max_temp_c']:5}"
                      f" ({s['thermometer']['verdict']:16})  wbt max {s['body']['max_wbt_c']:5}"
                      f" {s['body']['band']:8} at {s['body']['at']}  avoid {s['avoid']}")
        out.append({"name": name, "peak": peak["date"], "gap": gap["date"] if gap else None})
    print(json.dumps(out))


if __name__ == "__main__":
    main()
