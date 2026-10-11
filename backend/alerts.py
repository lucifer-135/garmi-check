"""Daily heat alerts: runs at 6:00 AM IST (EventBridge) and emails via SNS.

For each preset city, checks today's forecast and publishes to the SNS topic if
any hour is high or extreme by wet-bulb. Each message carries a `city` attribute
so subscribers can filter to their city.

Demo / manual run (Lambda console Test event):
  {"replay_date": "2024-06-01", "cities": ["chennai"]}
replays a past day from the archive instead of today's forecast.
"""
import json
import os
from datetime import date

from app import ApiError, replay, risk
from cities import CITIES
from heat import RISKY_BANDS

APP_URL = os.environ.get("APP_URL", "https://main.dvom9khnw26xr.amplifyapp.com")
REGION_NAME = {"plains": "plains", "coastal": "coast", "hills": "hills"}
VERDICT = {
    "heatwave_by_temp": "heatwave by temperature alone (45 °C or more)",
    "meets_threshold": "crosses the official {t:g} °C mark",
    "below_threshold": "below the official heatwave mark ({t:g} °C, {region})",
}
HEADLINE = {"high": "HIGH RISK for heavy outdoor work", "extreme": "EXTREME RISK for any outdoor work"}
HEADLINE_HI = {"high": "भारी बाहरी काम के लिए ज़्यादा जोखिम", "extreme": "किसी भी बाहरी काम के लिए बहुत ज़्यादा ख़तरा"}


def build_alert(city: dict, day: dict, replay_date: str = None) -> tuple:
    """Return (subject, message) for a risky day. Subject is ASCII and under 100 chars."""
    th, body = day["thermometer"], day["body"]
    band = body["band"]
    ranges = ", ".join(f"{w['from']}–{w['to']}" for w in day["avoid"])
    ranges_ascii = ranges.replace("–", "-")
    pretty_date = date.fromisoformat(day["date"]).strftime("%a %d %b %Y")
    verdict = VERDICT[th["verdict"]].format(t=th["threshold_c"], region=REGION_NAME[city["region"]])

    prefix = f"[Replay {replay_date}] " if replay_date else ""
    subject = f"{prefix}Garmi Check: {band.upper()} heat risk in {city['en']}, avoid heavy work {ranges_ascii}"
    if len(subject) > 99:
        subject = f"{prefix}Garmi Check: {band.upper()} heat risk in {city['en']}"

    lines = [
        f"Garmi Check heat alert: {city['en']}, {pretty_date}",
        "",
        f"{HEADLINE[band]} (wet-bulb estimate).",
        f"Thermometer says: {th['max_temp_c']:.1f} °C, {verdict}.",
        f"Your body feels: wet-bulb {body['max_wbt_c']:.1f} °C at {body['at']} "
        f"({body['temp_c']:.1f} °C, {body['rh']}% humidity).",
        f"Avoid heavy work between: {ranges}",
    ]
    if th["verdict"] == "below_threshold":
        lines.append("The thermometer alone would not flag this day. Humidity makes it risky.")
    lines += [
        "",
        f"गर्मी चेक: {city['hi']} में {HEADLINE_HI[band]}। इन घंटों में भारी काम से बचें: {ranges}",
        "",
        f"Hour by hour: {APP_URL}/?city={city['id']}",
        "If someone is suffering from the heat (NDMA): move them to a cool place under the shade, "
        "give water or a rehydrating drink if conscious, loosen clothes. Emergency: 112 / 108.",
        "Estimate, not medical advice. Weather data: Open-Meteo (CC BY 4.0).",
    ]
    if replay_date:
        lines.append(f"(Replay of {replay_date} from the Open-Meteo archive, sent as a demonstration.)")
    return subject, "\n".join(lines)


def handler(event, context):
    import boto3  # available in the Lambda Python runtime

    event = event if isinstance(event, dict) else {}
    replay_date = event.get("replay_date")
    only = event.get("cities")
    sns = boto3.client("sns")
    topic = os.environ["TOPIC_ARN"]

    results = []
    for city in CITIES:
        if only and city["id"] not in only:
            continue
        place = {"lat": city["lat"], "lon": city["lon"], "region": city["region"]}
        try:
            data = replay(place, replay_date) if replay_date else risk(place)
        except ApiError as e:
            results.append({"city": city["id"], "error": e.message})
            continue
        day = data["days"][0]
        band = (day["body"] or {}).get("band")
        if band not in RISKY_BANDS:
            results.append({"city": city["id"], "band": band, "sent": False})
            continue
        subject, message = build_alert(city, day, replay_date)
        sns.publish(TopicArn=topic, Subject=subject, Message=message,
                    MessageAttributes={"city": {"DataType": "String", "StringValue": city["id"]}})
        results.append({"city": city["id"], "band": band, "sent": True, "avoid": day["avoid"]})

    summary = {"date": replay_date or "today", "results": results}
    print(json.dumps(summary, ensure_ascii=False))
    return summary
