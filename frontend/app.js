// Garmi Check frontend. Plain JS, no framework.
(function () {
  "use strict";

  // API Gateway base URL (set after `sam deploy`). Local dev server serves the API on the same origin.
  var DEPLOYED_API = "https://00j78xdnh0.execute-api.ap-south-1.amazonaws.com";
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var API = LOCAL ? "" : DEPLOYED_API;

  // Text may use **bold**; it is escaped first, then the markers become <b>.
  var T = {
    en: {
      appName: "Garmi Check",
      appSub: "Heat Safety & Wet-Bulb",
      tagline: "Hour-by-hour heat check for outdoor work: what the thermometer says, and what your body feels.",
      cityLabel: "Select city",
      useLocation: "My location",
      locating: "Finding you…",
      locError: "Couldn't get your location. Pick a city instead.",
      yourLocation: "Your location",
      regionLabel: "Area type",
      plains: "Plains", coastal: "Coast", hills: "Hills",
      regionName: { plains: "plains", coastal: "coast", hills: "hills" },
      today: "Today", tomorrow: "Tomorrow",
      mode: { live: "Live forecast", replay: "Replay", cited: "News report" },
      modeSrc: { live: "Open-Meteo", replay: "Open-Meteo archive (ERA5 model data)", cited: "Down To Earth, single midday reading" },
      backLive: "← Back to live",
      loading: "Checking the heat…",
      error: "Couldn't load the heat check.",
      retry: "Try again",
      headline: { lower: "Lower risk by wet-bulb", high: "High risk for heavy outdoor work", extreme: "Extreme risk for any outdoor work" },
      peak: "Peak wet-bulb **{wbt} °C** at {time} ({temp} °C, {rh}% humidity)",
      peakNoTime: "Wet-bulb **{wbt} °C** ({temp} °C, {rh}% humidity)",
      thermoSays: "Thermometer says",
      bodyFeels: "Your body feels",
      highestTemp: "Highest temperature",
      wetBulb: "Wet-bulb (heat + humidity)",
      verdict: {
        heatwave_by_temp: "Heatwave by temperature alone **(45 °C or more)**.",
        meets_threshold: "Crosses the official **{t} °C** mark. An official heatwave also needs 4.5 °C above normal.",
        below_threshold: "Below the official heatwave mark **({t} °C {region})**."
      },
      verdictShort: { heatwave_by_temp: "heatwave by temperature", meets_threshold: "crosses the official mark", below_threshold: "below the official heatwave mark" },
      band: { lower: "Lower risk", high: "High risk", extreme: "Extreme risk" },
      bandShort: { lower: "Lower risk", high: "High", extreme: "Extreme" },
      bandDesc: { lower: "Below the indicative 30 °C wet-bulb line.", high: "30–35 °C wet-bulb: overheating risk with heavy work.", extreme: "35 °C or more: near the limit the body can cool itself." },
      gapNote: "The thermometer alone would not flag this day. Humidity makes it risky.",
      dryNote: "The thermometer crosses the official heatwave mark. Dry heat is still dangerous: follow official heatwave advice even when wet-bulb reads lower.",
      avoid: "Avoid heavy work between",
      noAvoid: "No high-risk hours by wet-bulb on this day.",
      calmHint: "Cooler months mostly read lower risk. Tap a real heat day below to see a summer day.",
      citedHint: "A single midday reading, so there is no hourly data for this day.",
      noData: "No data for this day.",
      hourly: "Hour by hour (wet-bulb °C)",
      scrollHint: "Scroll →",
      now: "Now",
      share: "Share on WhatsApp",
      realDay: "See a real heat day",
      caseTag: "Case studies",
      caseDesc: "Compare with real humid-heat days from past Indian summers:",
      citedChip: "news report", replayChip: "replay",
      adviceTitle: "If someone is suffering from the heat",
      advice: [
        "**Move the person to a cool place** under the shade.",
        "**Give water or a rehydrating drink** (if the person is still conscious).",
        "**Do not give alcohol, caffeine or aerated drink.**",
        "**Loosen clothes** for better ventilation."
      ],
      sosLabel: "Emergency helpline",
      sosText: "Call **112** or **108** for an ambulance",
      dial: "Dial 112",
      sourceLabel: "Source:",
      ndmaLink: "NDMA heatwave guidance (ndma.gov.in)",
      howTitle: "How this works (wet-bulb science)",
      how: [
        "**Wet-bulb temperature** combines heat and humidity: it shows how well sweat can still cool you. Commonly cited bands: **below 30 °C** lower risk, **30–35 °C** overheating risk, **35 °C and above** near the survival limit. A 2021 study suggests the limit may be lower in humid air.",
        "**India declares heatwaves from temperature only**: 40 °C on the plains, 37 °C on the coast, 30 °C in the hills, plus 4.5 °C above normal. 45 °C counts automatically. Wet-bulb is not calculated.",
        "We estimate hourly wet-bulb with the **Stull (2011)** formula (error about −1 to +0.65 °C) from Open-Meteo temperature and humidity. This is a **screening aid, not medical advice**."
      ],
      footer: "Estimate, not medical advice.",
      footerData: "Weather data:",
      shareMsg: "Garmi Check: {place}, {date}\nThermometer: {temp} °C ({verdict})\nBody (wet-bulb): {wbt} °C, {band}\n{avoid}\nEstimate, not medical advice.\n{url}",
      shareAvoid: "Avoid heavy work: {ranges}",
      shareNoAvoid: "No high-risk hours by wet-bulb."
    },
    hi: {
      appName: "गर्मी चेक",
      appSub: "गर्मी से बचाव · वेट-बल्ब",
      tagline: "बाहर काम करने वालों के लिए घंटे-दर-घंटे गर्मी जाँच: थर्मामीटर क्या कहता है, और शरीर पर क्या असर होता है।",
      cityLabel: "शहर चुनें",
      useLocation: "मेरी लोकेशन",
      locating: "ढूँढ रहे हैं…",
      locError: "आपकी लोकेशन नहीं मिली। कोई शहर चुनें।",
      yourLocation: "आपकी लोकेशन",
      regionLabel: "इलाका",
      plains: "मैदानी", coastal: "तटीय", hills: "पहाड़ी",
      regionName: { plains: "मैदानी", coastal: "तटीय", hills: "पहाड़ी" },
      today: "आज", tomorrow: "कल",
      mode: { live: "लाइव पूर्वानुमान", replay: "रीप्ले", cited: "समाचार रिपोर्ट" },
      modeSrc: { live: "Open-Meteo", replay: "Open-Meteo आर्काइव (ERA5 मॉडल डेटा)", cited: "Down To Earth, दोपहर की एक रीडिंग" },
      backLive: "← लाइव पर वापस",
      loading: "गर्मी जाँच रहे हैं…",
      error: "गर्मी की जाँच लोड नहीं हुई।",
      retry: "फिर कोशिश करें",
      headline: { lower: "वेट-बल्ब के हिसाब से कम जोखिम", high: "भारी बाहरी काम के लिए ज़्यादा जोखिम", extreme: "किसी भी बाहरी काम के लिए बहुत ज़्यादा ख़तरा" },
      peak: "सबसे ज़्यादा वेट-बल्ब **{wbt} °C**, {time} बजे ({temp} °C, {rh}% नमी)",
      peakNoTime: "वेट-बल्ब **{wbt} °C** ({temp} °C, {rh}% नमी)",
      thermoSays: "थर्मामीटर कहता है",
      bodyFeels: "शरीर पर असर",
      highestTemp: "सबसे ज़्यादा तापमान",
      wetBulb: "वेट-बल्ब (गर्मी + नमी)",
      verdict: {
        heatwave_by_temp: "सिर्फ़ तापमान से ही लू **(45 °C या ज़्यादा)**।",
        meets_threshold: "आधिकारिक **{t} °C** सीमा पार। आधिकारिक लू के लिए सामान्य से 4.5 °C ज़्यादा होना भी ज़रूरी है।",
        below_threshold: "लू की आधिकारिक सीमा **({t} °C, {region})** से नीचे।"
      },
      verdictShort: { heatwave_by_temp: "तापमान से लू", meets_threshold: "आधिकारिक सीमा पार", below_threshold: "लू की आधिकारिक सीमा से नीचे" },
      band: { lower: "कम जोखिम", high: "ज़्यादा जोखिम", extreme: "बहुत ज़्यादा ख़तरा" },
      bandShort: { lower: "कम जोखिम", high: "ज़्यादा", extreme: "बहुत ज़्यादा" },
      bandDesc: { lower: "वेट-बल्ब 30 °C की अनुमानित रेखा से कम।", high: "वेट-बल्ब 30–35 °C: भारी काम में शरीर ज़्यादा गर्म होने का ख़तरा।", extreme: "35 °C या ज़्यादा: शरीर ख़ुद को ठंडा रखने की सीमा के पास।" },
      gapNote: "सिर्फ़ थर्मामीटर से यह दिन ख़तरनाक नहीं दिखता। नमी इसे जोखिम भरा बनाती है।",
      dryNote: "तापमान लू की आधिकारिक सीमा पार कर रहा है। सूखी गर्मी भी ख़तरनाक है: वेट-बल्ब कम होने पर भी लू की सरकारी सलाह मानें।",
      avoid: "इन घंटों में भारी काम से बचें",
      noAvoid: "इस दिन वेट-बल्ब के हिसाब से कोई ज़्यादा जोखिम वाला घंटा नहीं।",
      calmHint: "ठंडे महीनों में जोखिम अक्सर कम दिखता है। गर्मी का असली दिन देखने के लिए नीचे टैप करें।",
      citedHint: "दोपहर की एक ही रीडिंग है, इसलिए इस दिन का घंटेवार डेटा नहीं है।",
      noData: "इस दिन का डेटा नहीं है।",
      hourly: "घंटे-दर-घंटे (वेट-बल्ब °C)",
      scrollHint: "स्क्रॉल करें →",
      now: "अभी",
      share: "WhatsApp पर भेजें",
      realDay: "असली गर्मी का दिन देखें",
      caseTag: "उदाहरण",
      caseDesc: "भारत की पिछली गर्मियों के असली उमस भरे दिनों से तुलना करें:",
      citedChip: "समाचार रिपोर्ट", replayChip: "रीप्ले",
      adviceTitle: "अगर किसी को गर्मी से तकलीफ़ हो",
      advice: [
        "**व्यक्ति को छाँव में किसी ठंडी जगह** ले जाएँ।",
        "**पानी या ORS जैसा पेय दें** (अगर व्यक्ति होश में हो)।",
        "**शराब, चाय-कॉफ़ी (कैफ़ीन) या कोल्ड ड्रिंक न दें।**",
        "हवा लगने के लिए **कपड़े ढीले करें।**"
      ],
      sosLabel: "आपातकालीन नंबर",
      sosText: "**112** या एम्बुलेंस के लिए **108** पर कॉल करें",
      dial: "112 डायल करें",
      sourceLabel: "स्रोत:",
      ndmaLink: "NDMA लू दिशानिर्देश (ndma.gov.in)",
      howTitle: "यह कैसे काम करता है (वेट-बल्ब विज्ञान)",
      how: [
        "**वेट-बल्ब तापमान** गर्मी और नमी दोनों को जोड़ता है: इससे पता चलता है कि पसीना शरीर को कितना ठंडा कर सकता है। आम तौर पर बताई जाने वाली सीमाएँ: **30 °C से कम** कम जोखिम, **30–35 °C** शरीर ज़्यादा गर्म होने का ख़तरा, **35 °C और ऊपर** जानलेवा सीमा के पास। 2021 के एक अध्ययन के अनुसार नम हवा में यह सीमा कम हो सकती है।",
        "**भारत में लू सिर्फ़ तापमान से घोषित होती है**: मैदानी इलाकों में 40 °C, तट पर 37 °C, पहाड़ों में 30 °C, साथ में सामान्य से 4.5 °C ज़्यादा। 45 °C पर अपने-आप लू मानी जाती है। वेट-बल्ब की गणना नहीं होती।",
        "हम Open-Meteo के तापमान और नमी से **Stull (2011)** फ़ॉर्मूले द्वारा हर घंटे का वेट-बल्ब अनुमान लगाते हैं (त्रुटि लगभग −1 से +0.65 °C)। यह **जाँच का साधन है, डॉक्टरी सलाह नहीं**।"
      ],
      footer: "यह अनुमान है, डॉक्टरी सलाह नहीं।",
      footerData: "मौसम डेटा:",
      shareMsg: "गर्मी चेक: {place}, {date}\nथर्मामीटर: {temp} °C ({verdict})\nशरीर पर असर (वेट-बल्ब): {wbt} °C, {band}\n{avoid}\nयह अनुमान है, डॉक्टरी सलाह नहीं।\n{url}",
      shareAvoid: "भारी काम से बचें: {ranges}",
      shareNoAvoid: "वेट-बल्ब के हिसाब से कोई ज़्यादा जोखिम वाला घंटा नहीं।"
    }
  };

  var BAND_RANGE = { lower: "< 30 °C", high: "30–35 °C", extreme: "≥ 35 °C" };
  var BAND_RANK = { lower: 0, high: 1, extreme: 2 };
  var ICON = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.53 1.37 5.08L2 22l5.17-1.36a9.87 9.87 0 0 0 4.87 1.28h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.39 1.3-1.92 1.38-.49.07-1.12.1-3.23-.77-2.7-1.12-4.44-3.86-4.57-4.04-.13-.18-1.09-1.45-1.09-2.76 0-1.32.69-1.96.93-2.22.25-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.4.06.61.57.24.58.82 2 .89 2.15.07.15.12.33.02.53-.1.2-.15.33-.3.51-.15.18-.31.4-.44.54-.15.15-.31.31-.13.62.18.31.78 1.29 1.68 2.09 1.15 1.03 2.13 1.35 2.44 1.5.31.15.49.13.67-.08.18-.21.78-.91.99-1.22.21-.31.42-.26.7-.15.28.11 1.78.84 2.08.99.3.15.51.23.58.36.07.13.07.75-.17 1.43z"/></svg>'
  };

  var state = {
    lang: "en",
    cityId: "chennai",
    loc: null,            // {lat, lon} when using browser location
    locName: null,        // {en: {city, state}, hi: {...}} from /place (Amazon Location Service)
    region: "plains",     // used with browser location
    view: "live",         // live | replay | cited
    exampleId: null,
    data: null,           // API response, or a cited reading
    dayIndex: 0,
    loading: false,
    error: null
  };

  var $ = function (id) { return document.getElementById(id); };
  function t(key) { return T[state.lang][key]; }
  function fill(str, vars) {
    return str.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ""; });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function rich(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }
  function plain(s) { return s.replace(/\*\*/g, ""); }
  function city(id) { return CITIES.find(function (c) { return c.id === id; }); }
  function cityName(c) { return c[state.lang] + ", " + c["state_" + state.lang]; }
  function example(id) {
    return CITED.find(function (e) { return e.id === id; }) || REPLAYS.find(function (e) { return e.id === id; });
  }
  function fmtDate(iso, opts) {
    var d = new Date(iso + "T12:00:00");
    return new Intl.DateTimeFormat(state.lang === "hi" ? "hi-IN" : "en-IN",
      opts || { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
  }
  function istNow() {
    // "YYYY-MM-DDTHH" in IST, to mark the current hour in the strip.
    var d = new Date(Date.now() + 5.5 * 3600 * 1000);
    return d.toISOString().slice(0, 13);
  }
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function locLabel() {
    var n = state.locName && state.locName[state.lang];
    if (!n) return null;
    return [n.city, n.state].filter(Boolean).join(", ");
  }

  function fetchPlaceName(loc) {
    fetch(API + "/place?lat=" + loc.lat + "&lon=" + loc.lon)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (body) {
        if (body && body.names && state.loc === loc) { state.locName = body.names; render(); }
      })
      .catch(function () {});
  }

  function currentPlace() {
    if (state.view !== "live") {
      var ex = example(state.exampleId), c = city(ex.city);
      return { name: cityName(c), lat: c.lat, lon: c.lon, region: c.region };
    }
    if (state.loc) {
      return { name: locLabel() || t("yourLocation"), lat: state.loc.lat, lon: state.loc.lon, region: state.region, mine: true };
    }
    var cc = city(state.cityId);
    return { name: cityName(cc), lat: cc.lat, lon: cc.lon, region: cc.region };
  }

  // ---------- data ----------

  function fetchData() {
    var place = currentPlace();
    state.error = null;
    if (state.view === "cited") {
      var ex = example(state.exampleId);
      state.data = { mode: "cited", days: [{ date: ex.date, thermometer: ex.thermometer, body: ex.body, avoid: null, hours: [] }] };
      state.dayIndex = 0;
      state.loading = false;
      render();
      return;
    }
    var url = API + (state.view === "replay" ? "/replay" : "/risk") +
      "?lat=" + place.lat + "&lon=" + place.lon + "&region=" + place.region +
      (state.view === "replay" ? "&date=" + example(state.exampleId).date : "");
    state.loading = true;
    state.data = null;
    render();
    var token = (fetchData.token = (fetchData.token || 0) + 1);
    fetch(url)
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw new Error(body.error || ("HTTP " + r.status));
          return body;
        });
      })
      .then(function (body) {
        if (token !== fetchData.token) return;
        state.data = body;
        state.dayIndex = 0;
      })
      .catch(function (e) {
        if (token !== fetchData.token) return;
        state.error = e.message || String(e);
      })
      .then(function () {
        if (token !== fetchData.token) return;
        state.loading = false;
        render();
      });
  }

  // ---------- rendering ----------

  function renderStatic() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (typeof v === "string") el.textContent = v;
    });
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === state.lang));
    });
    document.querySelectorAll("[data-region]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-region") === state.region));
    });
    var sel = $("city");
    sel.innerHTML = CITIES.map(function (c) {
      return '<option value="' + c.id + '">' + esc(cityName(c)) + "</option>";
    }).join("") + (state.loc ? '<option value="__loc">📍 ' + esc(locLabel() || t("yourLocation")) + "</option>" : "");
    sel.value = state.loc ? "__loc" : state.cityId;
    $("regionRow").hidden = !state.loc;
    $("adviceList").innerHTML = t("advice").map(function (a) { return "<li><span>" + rich(a) + "</span></li>"; }).join("");
    $("howList").innerHTML = t("how").map(function (a) { return "<p>" + rich(a) + "</p>"; }).join("");
    $("sosText").innerHTML = rich(t("sosText"));

    $("realDays").innerHTML = CITED.concat(REPLAYS).map(function (e) {
      var c = city(e.city), cited = e.id.indexOf("cited") === 0;
      return '<button type="button" data-example="' + e.id + '" aria-pressed="' + (state.exampleId === e.id && state.view !== "live") + '">' +
        "<span>" + esc(c[state.lang]) + ", " + esc(fmtDate(e.date, { day: "numeric", month: "short", year: "numeric" })) + "</span>" +
        "<small>(" + esc(cited ? t("citedChip") : t("replayChip")) + ")</small></button>";
    }).join("");

    // Live / replay / news-report status row
    var place = currentPlace();
    $("modeDot").className = "mdot " + state.view;
    $("modeNote").textContent = t("mode")[state.view];
    $("modeSrc").textContent = t("modeSrc")[state.view];
    $("metaPlace").hidden = state.view !== "live";
    $("metaPlace").textContent = place.mine ? "📍 " + place.name : place.name.split(",")[0];
    $("metaPlace").title = place.mine ? place.lat + ", " + place.lon : "";
    $("backLive").hidden = state.view === "live";
  }

  function daysHtml(days, day, place) {
    if (state.view === "live" && days.length > 1) {
      return '<div class="days" role="tablist">' + days.slice(0, 2).map(function (d, i) {
        return '<button type="button" role="tab" data-day="' + i + '" aria-selected="' + (i === state.dayIndex) + '">' +
          "<span>" + esc(i === 0 ? t("today") : t("tomorrow")) + "</span><i>·</i><small>" +
          esc(fmtDate(d.date, { day: "numeric", month: "short" })) + "</small></button>";
      }).join("") + "</div>";
    }
    return '<div class="days"><div class="one"><span>' + esc(place.name.split(",")[0]) + "</span><i>·</i><small>" +
      esc(fmtDate(day.date)) + "</small></div></div>";
  }

  function heroHtml(day) {
    var b = day.body;
    if (!b) return '<article class="hero t-none"><div class="hero-title">' + esc(t("noData")) + "</div></article>";
    var sub = fill(b.at ? t("peak") : t("peakNoTime"),
      { wbt: b.max_wbt_c.toFixed(1), time: b.at, temp: Number(b.temp_c).toFixed(1), rh: b.rh });
    return '<article class="hero t-' + b.band + '"><div class="hero-top">' +
      '<div class="hero-title"><span class="ping" aria-hidden="true"></span><span>' + esc(t("headline")[b.band]) + "</span></div>" +
      '<span class="badge">' + esc(BAND_RANGE[b.band]) + "</span></div>" +
      "<p>" + rich(sub) + "</p></article>";
  }

  function gaugePct(temp) { return Math.max(3, Math.min(100, (temp - 20) / (50 - 20) * 100)); }

  function twinHtml(day, place) {
    var th = day.thermometer, b = day.body;
    if (!th || !b) return "";
    var verdict = fill(t("verdict")[th.verdict], { t: th.threshold_c, region: t("regionName")[place.region] });
    var fillCls = th.verdict === "heatwave_by_temp" ? "heatwave" : th.verdict === "meets_threshold" ? "meets" : "";
    return '<section class="twin">' +
      '<div class="card-w metric"><div>' +
        '<div class="mk up"><span aria-hidden="true">🌡️</span><span>' + esc(t("thermoSays")) + "</span></div>" +
        '<div class="mv"><b>' + th.max_temp_c.toFixed(1) + "</b><span>°C</span></div>" +
        '<span class="ms">' + esc(t("highestTemp")) + "</span></div>" +
        '<div class="mfoot"><p>' + rich(verdict) + "</p>" +
        '<div class="gauge" aria-hidden="true"><div class="' + fillCls + '" style="width:' + gaugePct(th.max_temp_c).toFixed(0) + '%"></div>' +
        '<s style="left:' + gaugePct(th.threshold_c).toFixed(0) + '%"></s></div></div></div>' +
      '<div class="card-w metric body t-' + b.band + '"><div>' +
        '<div class="mk up"><span aria-hidden="true">💧</span><span>' + esc(t("bodyFeels")) + "</span></div>" +
        '<div class="mv"><b>' + b.max_wbt_c.toFixed(1) + "</b><span>°C</span></div>" +
        '<span class="ms">' + esc(t("wetBulb")) + "</span></div>" +
        '<div class="mfoot"><span class="chip">' + esc(t("band")[b.band]) + " (" + esc(BAND_RANGE[b.band]) + ")</span>" +
        "<p>" + esc(t("bandDesc")[b.band]) + "</p></div></div>" +
      "</section>";
  }

  function notesHtml(day) {
    var th = day.thermometer, b = day.body;
    if (!th || !b) return "";
    if (th.verdict === "below_threshold" && b.band !== "lower") {
      return '<div class="note t-' + b.band + '"><span class="bang" aria-hidden="true">!</span><span>' + esc(t("gapNote")) + "</span></div>";
    }
    if (th.verdict !== "below_threshold" && b.band === "lower") {
      return '<div class="note t-extreme"><span class="bang" aria-hidden="true">!</span><span>' + esc(t("dryNote")) + "</span></div>";
    }
    return "";
  }

  function rangesText(avoid) {
    return avoid.map(function (w) { return w.from + "–" + w.to; }).join(", ");
  }

  function insightHtml(day) {
    if (!day.avoid) {
      return '<div class="card-w insight"><div class="ic">' + ICON.clock + '</div><div><p class="ss" style="margin:4px 0 0">' +
        esc(t("citedHint")) + "</p></div></div>";
    }
    if (!day.avoid.length) {
      var hint = state.view === "live" && day.body && day.body.band === "lower" ? '<p class="ss">' + esc(t("calmHint")) + "</p>" : "";
      return '<div class="card-w insight"><div class="ic">' + ICON.clock + '</div><div><p class="tt">' +
        esc(t("noAvoid")) + "</p>" + hint + "</div></div>";
    }
    var worst = day.avoid.reduce(function (w, a) { return BAND_RANK[a.band] > BAND_RANK[w] ? a.band : w; }, "high");
    return '<div class="card-w insight risk t-' + worst + '"><div class="ic">' + ICON.clock + '</div><div><p class="tt">' +
      esc(t("avoid")) + '</p><span class="rng">' + esc(rangesText(day.avoid)) + "</span></div></div>";
  }

  function hourlyHtml(day) {
    if (!day.hours || !day.hours.length) return "";
    var nowKey = state.view === "live" ? istNow() : null;
    var tiles = day.hours.map(function (h) {
      var band = h.band || "none", key = h.time.slice(0, 13), isNow = nowKey && key === nowKey;
      var cls = "tile t-" + band + (nowKey && key < nowKey ? " past" : "") + (isNow ? " now" : "");
      var label = h.time.slice(11, 13) + ":00 · " + (h.wbt_c != null ? h.wbt_c.toFixed(1) + " °C · " : "") +
        (h.band ? t("band")[h.band] : "");
      return '<div class="' + cls + '" role="listitem" aria-label="' + esc(label) + '" title="' +
        esc(label + (h.temp_c != null ? " (" + h.temp_c + " °C, " + h.rh + "%)" : "")) + '">' +
        '<span class="h">' + (isNow ? esc(t("now")) : h.time.slice(11, 13)) + "</span>" +
        '<span class="mark" aria-hidden="true"></span>' +
        '<span class="w">' + (h.wbt_c != null ? h.wbt_c.toFixed(1) : "–") + "</span></div>";
    }).join("");
    var legend = ["lower", "high", "extreme"].map(function (b) {
      return '<span class="t-' + b + '"><span class="mark ' + b + '" aria-hidden="true"></span>' +
        esc(t("bandShort")[b]) + " (" + esc(BAND_RANGE[b].replace(/\s/g, "")) + ")</span>";
    }).join("");
    return '<section class="hourly"><div class="sec-h"><h2 class="up">' + esc(t("hourly")) + "</h2><span>" +
      esc(t("scrollHint")) + '</span></div><div class="strip" id="strip" role="list">' + tiles +
      '</div><div class="legend">' + legend + "</div></section>";
  }

  function shareUrl() {
    var p = new URLSearchParams();
    if (state.view !== "live") p.set("day", state.exampleId);
    else if (!state.loc) p.set("city", state.cityId);
    if (state.lang !== "en") p.set("lang", state.lang);
    var q = p.toString();
    return location.origin + location.pathname + (q ? "?" + q : "");
  }

  function shareText(day, place) {
    var th = day.thermometer, b = day.body;
    var avoid = day.avoid == null ? "" : (day.avoid.length ? fill(t("shareAvoid"), { ranges: rangesText(day.avoid) }) : t("shareNoAvoid"));
    return fill(t("shareMsg"), {
      place: place.name, date: fmtDate(day.date), temp: th.max_temp_c.toFixed(1),
      verdict: t("verdictShort")[th.verdict], wbt: b.max_wbt_c.toFixed(1),
      band: t("band")[b.band].toUpperCase(), avoid: avoid, url: shareUrl()
    }).replace(/\n\n/g, "\n");
  }

  function render() {
    renderStatic();
    var place = currentPlace();
    if (state.loading) {
      $("result").innerHTML = '<div class="card-w loading">' + esc(t("loading")) + "</div>";
      return;
    }
    if (state.error) {
      $("result").innerHTML = '<div class="error"><b>' + esc(t("error")) + "</b><br>" + esc(state.error) +
        '<br><button type="button" id="retry">' + esc(t("retry")) + "</button></div>";
      $("retry").onclick = fetchData;
      return;
    }
    if (!state.data) { $("result").innerHTML = ""; return; }

    var days = state.data.days || [];
    var day = days[state.dayIndex] || days[0];
    if (!day) { $("result").innerHTML = '<div class="error">' + esc(t("noData")) + "</div>"; return; }

    var out = daysHtml(days, day, place) + heroHtml(day) + twinHtml(day, place) + notesHtml(day) +
      insightHtml(day) + hourlyHtml(day);
    if (day.body && day.thermometer) {
      out += '<a class="share" id="share" target="_blank" rel="noopener" href="https://wa.me/?text=' +
        encodeURIComponent(shareText(day, place)) + '">' + ICON.whatsapp + "<span>" + esc(t("share")) + "</span></a>";
    }
    $("result").innerHTML = out;

    document.querySelectorAll("[data-day]").forEach(function (b) {
      b.onclick = function () { state.dayIndex = Number(b.getAttribute("data-day")); render(); };
    });
    // Scroll the strip so the current or first risky hour is visible.
    var strip = $("strip");
    if (strip) {
      var target = strip.querySelector(".now") || strip.querySelector(".t-extreme, .t-high");
      strip.style.scrollBehavior = "auto";
      if (target) strip.scrollLeft = Math.max(0, target.offsetLeft - strip.offsetLeft - 80);
      strip.style.scrollBehavior = "";
    }
    syncUrl();
  }

  function syncUrl() {
    try { history.replaceState(null, "", shareUrl()); } catch (e) {}
  }

  // ---------- events ----------

  function goLive() {
    state.view = "live";
    state.exampleId = null;
    fetchData();
  }

  function bind() {
    document.querySelectorAll("[data-lang]").forEach(function (b) {
      b.onclick = function () { state.lang = b.getAttribute("data-lang"); store("gc-lang", state.lang); render(); };
    });
    document.querySelectorAll("[data-region]").forEach(function (b) {
      b.onclick = function () { state.region = b.getAttribute("data-region"); goLive(); };
    });
    $("city").onchange = function (e) {
      if (e.target.value === "__loc") return;
      state.cityId = e.target.value;
      state.loc = null;
      goLive();
    };
    $("backLive").onclick = goLive;
    $("realDays").onclick = function (e) {
      var b = e.target.closest("[data-example]");
      if (!b) return;
      state.exampleId = b.getAttribute("data-example");
      state.view = state.exampleId.indexOf("cited") === 0 ? "cited" : "replay";
      fetchData();
      $("result").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    $("locate").onclick = function () {
      var btn = $("locate");
      if (!navigator.geolocation) { alert(t("locError")); return; }
      btn.disabled = true;
      btn.lastElementChild.textContent = t("locating");
      navigator.geolocation.getCurrentPosition(function (pos) {
        btn.disabled = false;
        btn.lastElementChild.textContent = t("useLocation");
        state.loc = { lat: pos.coords.latitude.toFixed(2), lon: pos.coords.longitude.toFixed(2) };
        state.locName = null;
        fetchPlaceName(state.loc);
        goLive();
      }, function () {
        btn.disabled = false;
        btn.lastElementChild.textContent = t("useLocation");
        alert(t("locError"));
      }, { timeout: 10000, maximumAge: 600000 });
    };
  }

  function init() {
    var q = new URLSearchParams(location.search);
    var lang = q.get("lang") || load("gc-lang");
    if (lang === "hi" || lang === "en") state.lang = lang;
    if (q.get("city") && city(q.get("city"))) state.cityId = q.get("city");
    if (q.get("day") && example(q.get("day"))) {
      state.exampleId = q.get("day");
      state.view = state.exampleId.indexOf("cited") === 0 ? "cited" : "replay";
    }
    bind();
    fetchData();
  }

  init();
})();
