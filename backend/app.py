"""Garmi Check API: Lambda handler for API Gateway HTTP API (payload v2).

GET /risk?lat=&lon=&region=              today and tomorrow from the Open-Meteo forecast
GET /replay?lat=&lon=&region=&date=      one past day from the Open-Meteo archive (ERA5)
"""
import json
import re
from datetime import date, datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from heat import REGION_THRESHOLDS_C, summarize_day

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
HOURLY = "temperature_2m,relative_humidity_2m"
TZ = "Asia/Kolkata"
IST = timezone(timedelta(hours=5, minutes=30))
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def _response(status: int, body: dict, cache_seconds: int = 0) -> dict:
    headers = {"Content-Type": "application/json; charset=utf-8",
               "Access-Control-Allow-Origin": "*"}
    if cache_seconds:
        headers["Cache-Control"] = f"public, max-age={cache_seconds}"
    return {"statusCode": status, "headers": headers,
            "body": json.dumps(body, ensure_ascii=False)}


def _place(qs: dict) -> dict:
    try:
        lat = float(qs.get("lat", ""))
        lon = float(qs.get("lon", ""))
    except ValueError:
        raise ApiError(400, "lat and lon must be numbers, e.g. ?lat=13.08&lon=80.27")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ApiError(400, "lat must be -90..90 and lon -180..180")
    region = qs.get("region", "plains")
    if region not in REGION_THRESHOLDS_C:
        raise ApiError(400, "region must be one of: plains, coastal, hills")
    # Two decimals (~1 km) is plenty for weather and avoids storing exact locations.
    return {"lat": round(lat, 2), "lon": round(lon, 2), "region": region}


def _fetch_hourly(url: str, params: dict) -> tuple:
    full = url + "?" + urlencode(params)
    try:
        with urlopen(full, timeout=8) as resp:
            data = json.load(resp)
    except HTTPError as e:
        reason = ""
        try:
            reason = json.load(e).get("reason", "")
        except Exception:
            pass
        raise ApiError(502, f"Weather service error ({e.code}). {reason}".strip())
    except (URLError, TimeoutError, OSError):
        raise ApiError(504, "Weather service did not respond. Try again in a minute.")
    hourly = data.get("hourly") or {}
    times = hourly.get("time") or []
    temps = hourly.get("temperature_2m") or [None] * len(times)
    rhs = hourly.get("relative_humidity_2m") or [None] * len(times)
    if not times:
        raise ApiError(502, "Weather service returned no hourly data.")
    return times, temps, rhs


def risk(place: dict) -> dict:
    times, temps, rhs = _fetch_hourly(FORECAST_URL, {
        "latitude": place["lat"], "longitude": place["lon"], "hourly": HOURLY,
        "timezone": TZ, "forecast_days": 2})
    dates = sorted({t[:10] for t in times})
    days = [summarize_day(d, times, temps, rhs, place["region"]) for d in dates]
    return {"place": place, "mode": "forecast", "days": days,
            "source": "Open-Meteo forecast"}


def replay(place: dict, day: str) -> dict:
    if not day or not DATE_RE.match(day):
        raise ApiError(400, "date must be YYYY-MM-DD")
    try:
        d = date.fromisoformat(day)
    except ValueError:
        raise ApiError(400, "date is not a real calendar day")
    today = datetime.now(IST).date()
    if d >= today:
        raise ApiError(400, "date must be in the past; use /risk for today")
    if d < date(1940, 1, 1):
        raise ApiError(400, "archive starts in 1940")
    times, temps, rhs = _fetch_hourly(ARCHIVE_URL, {
        "latitude": place["lat"], "longitude": place["lon"], "hourly": HOURLY,
        "timezone": TZ, "start_date": day, "end_date": day})
    summary = summarize_day(day, times, temps, rhs, place["region"])
    if summary["body"] is None:
        raise ApiError(404, "No archive data for that day yet (the archive lags about 5 days).")
    return {"place": place, "mode": "replay", "days": [summary],
            "source": "Open-Meteo historical (ERA5 reanalysis)"}


def place_name(place: dict) -> dict:
    """City and state for a location via Amazon Location Service (reverse geocode)."""
    import boto3  # available in the Lambda Python runtime

    client = boto3.client("geo-places")
    names = {}
    for lang in ("en", "hi"):
        try:
            resp = client.reverse_geocode(
                QueryPosition=[place["lon"], place["lat"]], MaxResults=1, Language=lang,
                Filter={"IncludePlaceTypes": ["Locality"]})
        except Exception as e:
            print(json.dumps({"route": "/place", "lang": lang, "error": str(e)[:300]}))
            continue
        items = resp.get("ResultItems") or []
        if not items:
            continue
        a = items[0].get("Address") or {}
        city = a.get("Locality") or a.get("District") or (a.get("SubRegion") or {}).get("Name")
        state = (a.get("Region") or {}).get("Name")
        country = (a.get("Country") or {}).get("Name")
        if city or state:
            names[lang] = {"city": city, "state": state, "country": country}
    if not names:
        raise ApiError(502, "Could not find a place name for this location.")
    names.setdefault("en", names.get("hi"))
    names.setdefault("hi", names.get("en"))
    return {"place": {"lat": place["lat"], "lon": place["lon"]}, "names": names,
            "source": "Amazon Location Service"}


INDEX = {
    "service": "Garmi Check API: humidity-aware heat risk (wet-bulb vs thermometer) for outdoor workers in India",
    "app": "https://main.dvom9khnw26xr.amplifyapp.com",
    "source": "https://github.com/lucifer-135/garmi-check",
    "endpoints": {
        "GET /risk?lat=&lon=&region=plains|coastal|hills": "today and tomorrow, hourly, from the Open-Meteo forecast",
        "GET /replay?lat=&lon=&region=&date=YYYY-MM-DD": "one past day from the Open-Meteo archive (ERA5)",
        "GET /place?lat=&lon=": "city and state for a location (Amazon Location Service), English and Hindi",
    },
    "examples": ["/risk?lat=13.08&lon=80.27&region=coastal",
                 "/replay?lat=13.08&lon=80.27&region=coastal&date=2024-06-01"],
    "note": "Estimate, not medical advice. Weather data: Open-Meteo (CC BY 4.0).",
}


def handler(event, context):
    path = event.get("rawPath", "")
    qs = event.get("queryStringParameters") or {}
    if path in ("", "/"):
        return _response(200, INDEX, 3600)
    try:
        place = _place(qs)
        if path.endswith("/risk"):
            body, cache = risk(place), 600
        elif path.endswith("/replay"):
            body, cache = replay(place, qs.get("date", "")), 86400
        elif path.endswith("/place"):
            body = place_name(place)
            print(json.dumps({"route": path, **place, "names": body["names"]}, ensure_ascii=False))
            return _response(200, body, 86400)
        else:
            raise ApiError(404, "Unknown route. Use /risk, /replay or /place.")
        peak = body["days"][0]["body"] or {}
        print(json.dumps({"route": path, **place, "date": qs.get("date"),
                          "max_wbt_c": peak.get("max_wbt_c"), "band": peak.get("band")}))
        return _response(200, body, cache)
    except ApiError as e:
        print(json.dumps({"route": path, "status": e.status, "error": e.message}))
        return _response(e.status, {"error": e.message})
