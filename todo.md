# Garmi Check: hackathon TODO

**Track:** Heat and Water · **Event:** Environmental Hacks (WeMakeDevs x AWS)

> **DEADLINE:** `__:__` on `__ Oct`. Copy it from the submit form now: https://www.wemakedevs.org/aws/env/submit (no late entries)
> **Code freeze:** deadline − 60 min · **Submitted by:** deadline − 15 min

**Pitch in one line:** India declares heatwaves by the thermometer. Your body feels the wet-bulb. Garmi Check shows outdoor workers both, hour by hour, in Hindi and English.

**MVP (the only thing that must work):** pick a city or "use my location", then see today's hourly heat risk from wet-bulb temperature next to the thermometer-only reading, with "avoid heavy work between X and Y". Live on AWS with a public URL. Everything else is optional.

**Don't get disqualified:**
- Repo history must match the event dates (no code from before Oct 8).
- AWS must be visible in the video. Mentioning it only in the writeup doesn't count.
- List the AI tools you used in the writeup.
- Credit anything you didn't write (data, formula, libraries, icons).
- Submit before the deadline. The form closes and late entries aren't accepted.

---

## If the deadline is 11:59 PM tonight

| By | Done |
|---|---|
| 8:40 PM | Phase 0: admin |
| 9:15 PM | Phase 1: core logic + tests |
| 9:55 PM | Phase 2: API live on AWS |
| 10:45 PM | Phase 3: frontend |
| 11:00 PM | Phase 4: site live. **Code freeze.** No time for Phase 5. |
| 11:40 PM | Phase 6: video uploaded |
| 11:45 PM | Phase 7: submitted |

If you're working solo, this is tight. Use the cut list early, not at 10:45.

---

## Phase 0: Admin (15 min, now)

- [ ] Open the submit form and fill in the deadline above. If the form is closed, stop and ask the organisers on the WeMakeDevs Discord.
- [ ] Every teammate: verify student status on AWS Builder Center (required to compete) and check in on the hackathon page with their own account.
- [ ] AWS account works (a debit card or RuPay works, with a verification charge of about ₹2). Use region `ap-south-1` (Mumbai) for everything.
- [ ] AWS Budgets: create a zero-spend budget, so you get an email if anything starts costing money.
- [ ] Create a **public** GitHub repo. The first commit is this file. Commit at least every 30 min.
- [ ] Tools: `aws sts get-caller-identity` and `sam --version` both work, and Python 3.12 or 3.13 is installed.

## Phase 1: Core logic in `backend/heat.py` (35 min)

- [ ] `wet_bulb_c(t_c, rh)` using the Stull (2011) formula (code in Reference).
  - Valid for RH 5–99 % and −20 to 50 °C.
  - Error is −1 to +0.65 °C, so show one decimal and call it an estimate.
- [ ] `body_band(wbt_c)`: `lower` below 30, `high` from 30 to below 35, `extreme` at 35 and above.
  - These are the commonly cited limits. Label them "indicative" and never print "safe".
- [ ] `thermometer_view(max_temp_c, region)`, with thresholds of 40 °C for plains, 37 °C for coastal and 30 °C for hills:
  - 45 °C or more: "heatwave by temperature alone"
  - from the threshold up to 45 °C: "meets the temperature threshold; an official heatwave also needs ≥ 4.5 °C above normal (not modelled)"
  - below the threshold: "below the official temperature threshold"
- [ ] `avoid_windows(hours)`: merge consecutive `high` or `extreme` hours into ranges like `12:00–16:00`.
- [ ] Tests in `backend/test_heat.py`:
  - [ ] Solapur 40 °C / 53 % gives 31.54 ± 0.05
  - [ ] Jalgaon 46.8 °C / 29 % gives 30.72 ± 0.05
  - [ ] Band edges: 29.9 is lower, 30.0 is high, 35.0 is extreme
  - [ ] Thermometer view: Jalgaon (46.8, plains) is a heatwave by temperature; Solapur (40, plains) only meets the threshold
- [ ] Commit.

## Phase 2: API on AWS in `backend/app.py` + `template.yaml` (40 min)

- [ ] Write the Lambda handler with the standard library only (`urllib.request`, `json`). It uses HttpApi payload v2: route on `event["rawPath"]` and read `event["queryStringParameters"]`.
  - [ ] `GET /risk?lat=&lon=&region=` calls the Open-Meteo forecast for today and tomorrow. It returns per-hour wet-bulb, bands, the thermometer view and avoid windows.
  - [ ] `GET /replay?lat=&lon=&region=&date=YYYY-MM-DD` returns the same output from the Open-Meteo archive for that day.
  - [ ] Return JSON with the header `Access-Control-Allow-Origin: *`. A plain GET from the browser needs no preflight.
  - [ ] Use `urlopen(..., timeout=8)`. Handle `null` humidity values and Open-Meteo errors with a clear message, not a 500.
- [ ] Write `template.yaml` (minimal version in Reference).
- [ ] Run `sam deploy --guided`. There are no dependencies, so `sam build` is optional; skip it if it complains about your Python version.
- [ ] Test: `curl "<API_URL>/risk?lat=13.08&lon=80.27&region=coastal"`
- [ ] Find replay days with a small local script.
  - For each preset city, pull April to June of a recent summer (for example 2024) from the archive.
  - Find the hour with the highest wet-bulb and save the city and date in `frontend/presets.js`.
  - Archive values are model data, not station readings, so they won't match the Solapur and Jalgaon article numbers. Keep the two sets separate.
- [ ] If SAM fights you for more than 15 min, create the function in the Lambda console instead. Paste the code and add an API Gateway HTTP API trigger.
- [ ] Commit.

## Phase 3: Frontend in `frontend/index.html` + `app.js` + `presets.js` (50 min)

- [ ] Use plain HTML, CSS and JS with no framework, so it loads fast on a cheap phone. Check it at 360 px width.
- [ ] City dropdown (presets in Reference).
- [ ] "Use my location" button. Browser geolocation works on the HTTPS Amplify URL.
- [ ] Region picker for your-location mode: plains, coastal or hills (default plains).
- [ ] Big result card with colour, an icon and words (not colour alone), plus the wet-bulb number.
- [ ] **Side by side: "Thermometer says" and "Your body feels". This is the demo moment.**
- [ ] An "Avoid heavy work between 12:00–16:00" line.
- [ ] Hourly strip for today: one small coloured block per hour, with the time.
- [ ] "Share on WhatsApp" button using `https://wa.me/?text=` plus a URL-encoded summary, so a supervisor or union rep can forward it.
- [ ] Hindi and English toggle (strings in Reference; have a native speaker check them).
- [ ] "See a real heat day" chips:
  - The two cited cases (Solapur and Jalgaon, 28 Mar 2024) are single midday readings. Hard-code them and name the source. They show the card only, with no hourly strip.
  - Add the replay days from Phase 2.
- [ ] Optional job picker (construction, delivery, vending, sanitation). Tonight it changes only the advice text and the WhatsApp message, not the thresholds.
- [ ] Advice lines: copy 3–4 do's from NDMA's heatwave guidance and cite it. Don't write your own medical advice.
- [ ] Footer: "Estimate, not medical advice. Weather data: Open-Meteo."
- [ ] Commit.

## Phase 4: Deploy the site (15 min)

- [ ] Put the API URL in `app.js`.
- [ ] In the Amplify console, choose Create new app, then Deploy without Git, then Drag and drop.
  - Zip the **contents** of `frontend/`, not the folder itself. Zipping the folder causes an "Access Denied" error.
- [ ] On a phone, open the Amplify URL and test the city picker, your location, Hindi, WhatsApp share and replay.
- [ ] Put the live URL in the README and commit.

## Phase 5: Stretch, email alerts (only if 75 min or more remain before the deadline)

- [ ] Create one SNS topic per preset city (for example `garmi-chennai`).
  - The fastest way to subscribe is to add your own email in the SNS console. The person subscribing must click the confirmation email.
  - A "Subscribe" form in the app is optional.
- [ ] Add a scheduled Lambda: a SAM `Schedule` event with `cron(30 0 * * ? *)`, which is 6:00 AM IST.
  - Give it `SNSPublishMessagePolicy`.
  - It checks today's forecast per city and publishes if any hour is `high` or worse.
- [ ] For the video, run the alert Lambda with the console's Test button and show the email arriving.
- [ ] **No SMS tonight.** SMS to Indian numbers on local routes needs TRAI DLT registration with a company's PAN, TAN, GSTIN and CIN. Mention SMS and WhatsApp alerts as a next step instead.

## Phase 6: Demo video, 3:00 max (start at code freeze)

- [ ] **0:00–0:25, the problem.** "India declares heatwaves by the thermometer. On 28 March 2024, Jalgaon was 46.8 °C and counted as a heatwave because it crossed 45 °C. Solapur was 40 °C, but at 53 % humidity its wet-bulb was 31.5 °C, higher than Jalgaon's 30.7 °C." Then add that 400–490 million informal workers have little control over their heat exposure.
- [ ] **0:25–1:40, the app on a phone.** Show:
  1. Pick a city or your location
  2. Thermometer and body readings side by side
  3. The avoid-hours line
  4. The Hindi toggle
  5. WhatsApp share
  6. Replay of a real heat day

  If live October data is green, say so; that's why replay exists.
- [ ] **1:40–2:25, AWS.**
  - Show an architecture diagram: Browser → Amplify → API Gateway → Lambda → Open-Meteo, plus EventBridge → SNS if built.
  - Then show the Lambda console, API Gateway, CloudWatch logs and `template.yaml`.
- [ ] **2:25–3:00, wrap-up.**
  - Who it's for: construction workers, delivery riders, street vendors, sanitation workers, and the supervisors and union reps who forward messages.
  - Limits: it's an estimate, and the bands are indicative.
  - Next steps: SMS and WhatsApp alerts, job-specific WBGT thresholds, and a map of cooling and water points.
- [ ] Record with OBS or a phone screen recorder and trim to 3:00 or less.
- [ ] Upload to YouTube as **Unlisted**. Open the link in an incognito window to check it plays when signed out.

## Phase 7: Submit (by deadline − 15 min)

- [ ] README covering:
  - [ ] the problem, with sources
  - [ ] what the app does
  - [ ] live URL and video link
  - [ ] architecture and deploy steps
  - [ ] AWS services used
  - [ ] AI tools used (the rules require this)
  - [ ] credits: Open-Meteo data, the Stull 2011 formula, any libraries or icons and their licences
- [ ] Short writeup for the form: the problem, what you built, and where AWS fits.
- [ ] Repo is public and the latest commit is pushed.
- [ ] Submit at https://www.wemakedevs.org/aws/env/submit (one submission per team) and screenshot the confirmation.
- [ ] Optional: an AWS Builder Center blog post (problem, stack, challenges) for the Top 5 blogs prize. It must be linked in the submission, so do it only if it's published before you submit.

---

## Team split (if 2–4 people)

- **A:** Phases 1–2 (logic, Lambda, SAM)
- **B:** Phases 3–4 (frontend, Amplify)
- **C:** Phase 0, the replay-day script, README, video script and recording
- **D:** Phase 5, only after the MVP is live

**Solo:** Phases 0 to 4, then 6 and 7. Skip Phase 5.

## Cut list (if you're behind, cut in this order)

1. Phase 5 alerts
2. Archive replay days (keep the two cited Solapur and Jalgaon cases; they need no API)
3. Job picker
4. Hourly strip (keep the big card and the avoid-hours line)
5. Hindi toggle (keep English and mention Hindi as a next step)

**Never cut:** the wet-bulb calculation with the side-by-side view, the deployed AWS URL, and the video.

---

## Pitch facts (for the video and README; keep the sources)

- **How India declares heatwaves:**
  - IMD uses temperature only: at least 40 °C on the plains, 37 °C on the coast or 30 °C in the hills, plus at least 4.5 °C above normal.
  - Anything above 45 °C counts automatically.
  - IMD does not calculate wet-bulb temperature. *(Down To Earth, Mar 2024)*
- **The two-city example (28 Mar 2024):** Solapur, 40 °C at 53 % humidity, had a wet-bulb of about 31.54 °C. Jalgaon, 46.8 °C at 29 % humidity, had about 30.72 °C, and counted as a heatwave only because it crossed 45 °C. *(Down To Earth)* Our Stull function reproduces both numbers.
- **Wet-bulb limits:** the commonly cited bands are below 30 °C lower risk, 30–35 °C hyperthermia risk, and above 35 °C extreme. A 2021 study suggests the 35 °C limit may be lower in high humidity. *(Down To Earth)*
- **Scale and policy gaps:** *(Drishti IAS, Apr 2026)*
  - About 400–490 million informal workers have little or no control over their heat exposure.
  - In 2024, heat cost India about 247 billion labour hours.
  - Heat is not a notified disaster under the Disaster Management Act, 2005.
  - India's heatwave classification ignores humidity.
- **Delhi, 2026 ground audit:** cooling zones could only be found by canvassing, and no government portal listed them. *(The Leaflet)*

---

## Reference

### Stull (2011) wet-bulb in °C (verified against both article numbers)

```python
from math import atan, sqrt

def wet_bulb_c(t_c: float, rh: float) -> float:
    """Stull (2011). t_c in °C, rh in % (valid 5-99). Error about -1 to +0.65 °C."""
    return (t_c * atan(0.151977 * sqrt(rh + 8.313659))
            + atan(t_c + rh) - atan(rh - 1.676331)
            + 0.00391838 * rh ** 1.5 * atan(0.023101 * rh)
            - 4.686035)

assert abs(wet_bulb_c(40, 53) - 31.54) < 0.05    # Solapur, 28 Mar 2024
assert abs(wet_bulb_c(46.8, 29) - 30.72) < 0.05  # Jalgaon, 28 Mar 2024
```

### When does wet-bulb cross 30 °C? (computed with the formula above)

| Temp | 60 % RH | 70 % RH | 80 % RH | 90 % RH |
|---|---|---|---|---|
| 32 °C | 25.8 | 27.5 | 29.0 | 30.6 |
| 34 °C | 27.6 | 29.3 | 31.0 | 32.6 |
| 36 °C | 29.4 | 31.2 | 32.9 | 34.5 |
| 38 °C | 31.2 | 33.0 | 34.8 | 36.5 |
| 40 °C | 33.0 | 34.9 | 36.7 | 38.5 |

Expect mostly "lower" in live October data. That's normal; use replay for the demo.

### Preset cities

| City | Lat | Lon | Region |
|---|---|---|---|
| Chennai | 13.08 | 80.27 | coastal |
| Mumbai | 19.08 | 72.88 | coastal |
| Visakhapatnam | 17.69 | 83.22 | coastal |
| Kochi | 9.93 | 76.27 | coastal |
| Delhi | 28.61 | 77.21 | plains |
| Nagpur | 21.15 | 79.09 | plains |
| Solapur | 17.66 | 75.91 | plains |
| Jalgaon | 21.01 | 75.56 | plains |

### Open-Meteo calls (no API key needed for non-commercial use)

```
Forecast: https://api.open-meteo.com/v1/forecast?latitude=13.08&longitude=80.27&hourly=temperature_2m,relative_humidity_2m&timezone=Asia/Kolkata&forecast_days=2
Archive:  https://archive-api.open-meteo.com/v1/archive?latitude=17.66&longitude=75.91&start_date=2024-04-01&end_date=2024-06-30&hourly=temperature_2m,relative_humidity_2m&timezone=Asia/Kolkata
```

Archive (ERA5) data lags by about 5 days. Credit Open-Meteo in the README.

### API response shape (illustrative values)

```json
{
  "place": {"lat": 13.08, "lon": 80.27, "region": "coastal"},
  "thermometer": {"max_temp_c": 36.0, "threshold_c": 37, "verdict": "below_threshold"},
  "body": {"max_wbt_c": 31.2, "band": "high"},
  "avoid": [{"from": "12:00", "to": "16:00", "band": "high"}],
  "hours": [{"time": "2026-10-12T13:00", "temp_c": 36.0, "rh": 70, "wbt_c": 31.2, "band": "high"}],
  "source": "Open-Meteo"
}
```

### Minimal `template.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  HeatFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/
      Handler: app.handler
      Runtime: python3.12
      Timeout: 10
      MemorySize: 256
      Events:
        Risk:
          Type: HttpApi
          Properties:
            Path: /risk
            Method: GET
        Replay:
          Type: HttpApi
          Properties:
            Path: /replay
            Method: GET
Outputs:
  ApiUrl:
    Value: !Sub "https://${ServerlessHttpApi}.execute-api.${AWS::Region}.amazonaws.com"
```

### Hindi UI strings (have a native speaker check them)

| English | हिंदी |
|---|---|
| Today's heat check | आज की गर्मी जाँच |
| Thermometer says | थर्मामीटर कहता है |
| Your body feels | शरीर पर असर |
| Lower risk | कम जोखिम |
| High risk | ज़्यादा जोखिम |
| Extreme risk | बहुत ज़्यादा ख़तरा |
| Avoid heavy work between | इन घंटों में भारी काम से बचें |
| Use my location | मेरी लोकेशन इस्तेमाल करें |
| Share on WhatsApp | WhatsApp पर भेजें |
| See a real heat day | असली गर्मी का दिन देखें |
| Estimate, not medical advice | यह अनुमान है, डॉक्टरी सलाह नहीं |

---

## Sources

- [Down To Earth: humid heat and IMD criteria (28 Mar 2024)](https://www.downtoearth.org.in/climate-change/indians-may-already-be-experiencing-temperatures-close-to-limits-of-human-survivability-without-even-being-aware-95278)
- [Drishti IAS: India's heat crisis and legislative vacuum (21 Apr 2026)](https://www.drishtiias.com/current-affairs-news-analysis-editorials/news-analysis/21-04-2026/print/manual)
- [The Leaflet: auditing Delhi's Heat Action Plan](https://theleaflet.in/governance-and-policy/auditing-delhis-heat-action-plan-a-ground-study-part-i)
- [Hackathon page](https://www.wemakedevs.org/aws/env) · [Rules](https://www.wemakedevs.org/aws/rules)
- [Open-Meteo forecast API](https://open-meteo.com/en/docs) · [Open-Meteo historical API](https://open-meteo.com/en/docs/historical-weather-api)
- [Stull formula validity and accuracy (NCAR NCL)](https://www.ncl.ucar.edu/Document/Functions/Contributed/wetbulb_stull.shtml)
- [AWS: sending SMS to India (DLT registration)](https://docs.aws.amazon.com/sms-voice/latest/userguide/registrations-sms-senderid-india.html)
- [AWS Amplify: deploy without Git](https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html)
