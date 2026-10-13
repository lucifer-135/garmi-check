# Garmi Check (गर्मी चेक)

**India declares heatwaves by the thermometer. Your body feels the wet-bulb.** Garmi Check shows outdoor workers both, hour by hour, in Hindi and English, and says which hours to avoid heavy work.

- **Live app:** https://main.dvom9khnw26xr.amplifyapp.com
- **API:** https://00j78xdnh0.execute-api.ap-south-1.amazonaws.com/risk?lat=13.08&lon=80.27&region=coastal
- **Demo video:** https://youtu.be/RIPnx9m9LdI

## The problem

- IMD declares a heatwave from temperature alone: at least 40 °C on the plains, 37 °C on the coast or 30 °C in the hills, plus at least 4.5 °C above normal. Anything above 45 °C counts automatically. IMD does not calculate wet-bulb temperature, which combines heat and humidity. ([Down To Earth, 28 Mar 2024](https://www.downtoearth.org.in/climate-change/indians-may-already-be-experiencing-temperatures-close-to-limits-of-human-survivability-without-even-being-aware-95278))
- On 28 March 2024, Jalgaon was 46.8 °C at 29 % humidity and counted as a heatwave because it crossed 45 °C. Solapur was 40 °C at 53 % humidity, and its wet-bulb (about 31.5 °C) was *higher* than Jalgaon's (about 30.7 °C). (Same source; our formula reproduces both numbers.)
- Commonly cited wet-bulb bands: below 30 °C lower risk, 30 to 35 °C risk of overheating, 35 °C and above near the limit of survival. A 2021 study suggests the limit may be lower in humid air. (Same source.)
- About 400 to 490 million informal workers in India have little or no control over their heat exposure, and heat cost about 247 billion labour hours in 2024. India's heatwave classification ignores humidity, and the OSHWC Code 2020 has no enforceable heat standard. ([Drishti IAS editorial, 21 Apr 2026](https://www.drishtiias.com/current-affairs-news-analysis-editorials/news-analysis/21-04-2026/print/manual))

Official alerts can miss humid heat. Garmi Check is a screening aid that fills that gap for the people who work outside: construction workers, delivery riders, street vendors, sanitation workers, and the supervisors and union reps who forward messages.

## What it does

1. Pick a city, or use your phone's location (shown as city and state, for example "Coimbatore, Tamil Nadu", via Amazon Location Service) and choose plains, coast or hills.
2. See **"Thermometer says"** (the day's highest temperature against the official heatwave mark) next to **"Your body feels"** (the peak wet-bulb estimate and its risk band).
3. If the thermometer alone would not flag the day but humidity makes it risky, the app says so.
4. **"Avoid heavy work between 12:00–16:00"**: consecutive high-risk hours merged into time windows.
5. An hour-by-hour strip for today and tomorrow (colour, symbol and number, so it does not rely on colour alone).
6. **Share on WhatsApp** with a ready-made summary, in Hindi or English.
7. **See a real heat day:** the two cited Down To Earth readings, plus replays of humid summer days from the Open-Meteo archive (for example Chennai on 1 Jun 2024: 36.8 °C, below the 37 °C coastal mark, but a wet-bulb of 30.3 °C, which is high risk). Live October data is mostly lower risk, so replay shows how the app behaves in summer.
8. First-aid steps quoted from NDMA's heatwave guidance, and emergency numbers.
9. **Daily 6 AM email alerts:** an EventBridge schedule runs a Lambda that checks today's forecast for every preset city and emails an SNS alert (English and Hindi) when any hour is high risk or worse, with the hours to avoid.

If the thermometer crosses the official mark but the wet-bulb reads low (dry heat), the app warns that dry heat is still dangerous instead of only showing "lower risk".

## Architecture (all AWS, region ap-south-1)

```
Phone browser ──► AWS Amplify Hosting (static HTML/CSS/JS)
      │
      └─ fetch ──► Amazon API Gateway (HTTP API, throttled)
                         └──► AWS Lambda (Python 3.13, no packaged dependencies)
                                   ├──► Open-Meteo forecast / archive API
                                   └──► Amazon Location Service (reverse geocode: city, state)
                         Lambda logs ──► Amazon CloudWatch Logs

Amazon EventBridge (06:00 IST daily) ──► AWS Lambda (alerts) ──► Amazon SNS ──► email
Deployed with AWS SAM (CloudFormation stack "garmi-check")
```

| Path | What it returns |
|---|---|
| `GET /risk?lat=&lon=&region=` | Today and tomorrow from the Open-Meteo forecast: hourly temperature, humidity, wet-bulb and band, the thermometer verdict, peak wet-bulb, and avoid windows |
| `GET /replay?lat=&lon=&region=&date=YYYY-MM-DD` | The same for one past day from the Open-Meteo archive (ERA5) |
| `GET /place?lat=&lon=` | City, state and country in English and Hindi, from Amazon Location Service |

Alerts go to the SNS topic `garmi-check-alerts`, with a `city` message attribute so a subscriber can use a filter policy to get only their city. To send a demo alert for a past day, test the `garmi-check-daily-alert` function with `{"replay_date": "2024-06-01", "cities": ["chennai"]}`.

Locations are rounded to two decimals (about 1 km) before use, and nothing is stored.

## How the numbers are made

- **Wet-bulb:** the Stull (2011) formula from hourly 2 m temperature and relative humidity. It is valid for 5 to 99 % RH and −20 to 50 °C, with an error of about −1 to +0.65 °C. See [`backend/heat.py`](backend/heat.py).
- **Bands:** lower below 30 °C, high from 30 to below 35 °C, extreme at 35 °C and above. These are indicative; the app never says "safe".
- **Thermometer view:** IMD-style temperature thresholds by region. The "4.5 °C above normal" part of the official rule is not modelled.
- **Replay days** were found with [`scripts/find_replay_days.py`](scripts/find_replay_days.py). Archive values are reanalysis model data, not station readings, so they are kept separate from the cited Solapur and Jalgaon figures.

## Run and deploy

```bash
# Tests (standard library only)
cd backend && python -m unittest -v test_heat

# Local preview: serves frontend/ and the API on http://localhost:8000
python scripts/dev_server.py

# Deploy the API (needs AWS CLI + SAM CLI and credentials, e.g. `aws login`)
sam deploy            # settings in samconfig.toml: stack garmi-check, ap-south-1

# Deploy the site to Amplify Hosting without Git
aws amplify create-app --name garmi-check --platform WEB      # once
aws amplify create-branch --app-id <APP_ID> --branch-name main # once
bash scripts/deploy_frontend.sh <APP_ID> main
```

Put the `ApiUrl` output from `sam deploy` into `DEPLOYED_API` at the top of [`frontend/app.js`](frontend/app.js).

## Limits

- It is an estimate, not medical advice. Wet-bulb does not capture direct sun, wind or workload; a WBGT-based, job-specific table would be better.
- The bands are indicative and commonly cited, not an Indian occupational standard.
- The Hindi text was machine-drafted and is being checked by a native speaker.

## Next steps

- SMS and WhatsApp alerts for supervisors, alongside today's email alerts (SMS to Indian numbers needs TRAI DLT registration), and a sign-up page with per-city filters.
- Job-specific work and rest advice from a published WBGT table.
- A map of cooling and drinking-water points; a 2026 audit of Delhi's Heat Action Plan found these could only be located by canvassing ([The Leaflet](https://theleaflet.in/governance-and-policy/auditing-delhis-heat-action-plan-a-ground-study-part-i)).

## AI tools used

- Claude (Anthropic) for planning and research, and Claude Code for writing code, tests and docs.

## Credits

- Weather data: [Open-Meteo](https://open-meteo.com/) forecast and historical APIs, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Historical data is based on ERA5 from the Copernicus Climate Change Service.
- Wet-bulb formula: Stull, R. (2011), "Wet-Bulb Temperature from Relative Humidity and Air Temperature", *Journal of Applied Meteorology and Climatology* 50(11). [doi:10.1175/JAMC-D-11-0143.1](https://doi.org/10.1175/JAMC-D-11-0143.1)
- First-aid lines: [NDMA, Heat Wave](https://ndma.gov.in/Natural-Hazards/Heat-Wave).
- Heatwave criteria and the Solapur/Jalgaon example: Down To Earth (28 Mar 2024).
- No third-party code libraries. Icons are emoji and a hand-written SVG.
