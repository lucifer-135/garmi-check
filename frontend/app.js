// Garmi Check frontend. Plain JS, no framework.
(function () {
  "use strict";

  // API Gateway base URL (set after `sam deploy`). Local dev server serves the API on the same origin.
  var DEPLOYED_API = "";
  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var API = LOCAL ? "" : DEPLOYED_API;

  var T = {
    en: {
      appName: "Garmi Check",
      tagline: "Hour-by-hour heat check for outdoor work: what the thermometer says, and what your body feels.",
      cityLabel: "City",
      useLocation: "Use my location",
      locating: "Finding you…",
      locError: "Couldn't get your location. Pick a city instead.",
      yourLocation: "Your location",
      regionLabel: "Area type (sets the official heatwave mark)",
      plains: "Plains", coastal: "Coast", hills: "Hills",
      regionName: { plains: "plains", coastal: "coast", hills: "hills" },
      today: "Today", tomorrow: "Tomorrow",
      liveNote: "Live forecast · Open-Meteo",
      calmHint: "Cooler months mostly read lower risk. Tap a real heat day below to see a summer day.",
      replayNote: "Replay of a past day · Open-Meteo archive (ERA5 model data, not a weather-station reading)",
      citedNote: "Single midday reading reported by Down To Earth (28 Mar 2024). No hourly data.",
      backLive: "← Back to live forecast",
      loading: "Checking the heat…",
      error: "Couldn't load the heat check.",
      retry: "Try again",
      headline: { lower: "Lower risk by wet-bulb", high: "High risk for heavy outdoor work", extreme: "Extreme risk for any outdoor work" },
      peak: "Peak wet-bulb {wbt} °C at {time} ({temp} °C, {rh}% humidity)",
      peakNoTime: "Wet-bulb {wbt} °C ({temp} °C, {rh}% humidity)",
      thermoSays: "Thermometer says",
      bodyFeels: "Your body feels",
      highestTemp: "highest temperature",
      wetBulb: "wet-bulb (heat + humidity)",
      verdict: {
        heatwave_by_temp: "Heatwave by temperature alone (45 °C or more).",
        meets_threshold: "Crosses the official {t} °C mark. An official heatwave also needs 4.5 °C above normal.",
        below_threshold: "Below the official heatwave mark ({t} °C, {region})."
      },
      verdictShort: { heatwave_by_temp: "heatwave by temperature", meets_threshold: "crosses the official mark", below_threshold: "below the official heatwave mark" },
      band: { lower: "Lower risk", high: "High risk", extreme: "Extreme risk" },
      bandDesc: { lower: "Below 30 °C wet-bulb (indicative).", high: "30–35 °C wet-bulb: overheating risk with heavy work.", extreme: "35 °C or more: near the limit the body can cool itself." },
      gapNote: "The thermometer alone would not flag this day. Humidity makes it risky.",
      dryNote: "The thermometer crosses the official heatwave mark. Dry heat is still dangerous: follow official heatwave advice even when wet-bulb reads lower.",
      avoid: "Avoid heavy work between",
      noAvoid: "No high-risk hours by wet-bulb on this day.",
      noData: "No data for this day.",
      hourly: "Hour by hour (wet-bulb °C)",
      now: "now",
      share: "Share on WhatsApp",
      realDay: "See a real heat day",
      citedChip: "news report", replayChip: "replay",
      adviceTitle: "If someone is suffering from the heat",
      advice: [
        "Move the person to a cool place under the shade.",
        "Give water or a rehydrating drink (if the person is still conscious).",
        "Do not give alcohol, caffeine or aerated drink.",
        "Loosen clothes for better ventilation."
      ],
      adviceSrc: "Source: NDMA heatwave guidance,",
      emergency: "Emergency: call 112, or 108 for an ambulance.",
      howTitle: "How this works",
      how: [
        "Wet-bulb temperature combines heat and humidity: it shows how well sweat can still cool you. Commonly cited bands: below 30 °C lower risk, 30–35 °C overheating risk, 35 °C and above near the survival limit. A 2021 study suggests the limit may be lower in humid air.",
        "India declares heatwaves from temperature only: 40 °C on the plains, 37 °C on the coast, 30 °C in the hills, plus 4.5 °C above normal. 45 °C counts automatically. Wet-bulb is not calculated.",
        "We estimate hourly wet-bulb with the Stull (2011) formula (error about −1 to +0.65 °C) from Open-Meteo temperature and humidity. This is a screening aid, not medical advice."
      ],
      footer: "Estimate, not medical advice.",
      footerData: "Weather data:",
      shareMsg: "Garmi Check: {place}, {date}\nThermometer: {temp} °C ({verdict})\nBody (wet-bulb): {wbt} °C, {band}\n{avoid}\nEstimate, not medical advice.\n{url}",
      shareAvoid: "Avoid heavy work: {ranges}",
      shareNoAvoid: "No high-risk hours by wet-bulb."
    },
    hi: {
      appName: "गर्मी चेक",
      tagline: "बाहर काम करने वालों के लिए घंटे-दर-घंटे गर्मी जाँच: थर्मामीटर क्या कहता है, और शरीर पर क्या असर होता है।",
      cityLabel: "शहर",
      useLocation: "मेरी लोकेशन इस्तेमाल करें",
      locating: "लोकेशन ढूँढ रहे हैं…",
      locError: "आपकी लोकेशन नहीं मिली। कोई शहर चुनें।",
      yourLocation: "आपकी लोकेशन",
      regionLabel: "इलाका (इससे लू की आधिकारिक सीमा तय होती है)",
      plains: "मैदानी", coastal: "तटीय", hills: "पहाड़ी",
      regionName: { plains: "मैदानी इलाका", coastal: "तटीय इलाका", hills: "पहाड़ी इलाका" },
      today: "आज", tomorrow: "कल",
      liveNote: "लाइव पूर्वानुमान · Open-Meteo",
      calmHint: "ठंडे महीनों में जोखिम अक्सर कम दिखता है। गर्मी का असली दिन देखने के लिए नीचे टैप करें।",
      replayNote: "पिछले दिन का रीप्ले · Open-Meteo आर्काइव (ERA5 मॉडल डेटा, मौसम केंद्र की रीडिंग नहीं)",
      citedNote: "Down To Earth (28 मार्च 2024) में छपी दोपहर की एक रीडिंग। घंटेवार डेटा नहीं।",
      backLive: "← लाइव पूर्वानुमान पर वापस",
      loading: "गर्मी जाँच रहे हैं…",
      error: "गर्मी की जाँच लोड नहीं हुई।",
      retry: "फिर कोशिश करें",
      headline: { lower: "वेट-बल्ब के हिसाब से कम जोखिम", high: "भारी बाहरी काम के लिए ज़्यादा जोखिम", extreme: "किसी भी बाहरी काम के लिए बहुत ज़्यादा ख़तरा" },
      peak: "सबसे ज़्यादा वेट-बल्ब {wbt} °C, {time} बजे ({temp} °C, {rh}% नमी)",
      peakNoTime: "वेट-बल्ब {wbt} °C ({temp} °C, {rh}% नमी)",
      thermoSays: "थर्मामीटर कहता है",
      bodyFeels: "शरीर पर असर",
      highestTemp: "सबसे ज़्यादा तापमान",
      wetBulb: "वेट-बल्ब (गर्मी + नमी)",
      verdict: {
        heatwave_by_temp: "सिर्फ़ तापमान से ही लू (45 °C या ज़्यादा)।",
        meets_threshold: "आधिकारिक {t} °C सीमा पार। आधिकारिक लू के लिए सामान्य से 4.5 °C ज़्यादा होना भी ज़रूरी है।",
        below_threshold: "लू की आधिकारिक सीमा ({t} °C, {region}) से नीचे।"
      },
      verdictShort: { heatwave_by_temp: "तापमान से लू", meets_threshold: "आधिकारिक सीमा पार", below_threshold: "लू की आधिकारिक सीमा से नीचे" },
      band: { lower: "कम जोखिम", high: "ज़्यादा जोखिम", extreme: "बहुत ज़्यादा ख़तरा" },
      bandDesc: { lower: "वेट-बल्ब 30 °C से कम (अनुमानित)।", high: "वेट-बल्ब 30–35 °C: भारी काम में शरीर ज़्यादा गर्म होने का ख़तरा।", extreme: "35 °C या ज़्यादा: शरीर ख़ुद को ठंडा रखने की सीमा के पास।" },
      gapNote: "सिर्फ़ थर्मामीटर से यह दिन ख़तरनाक नहीं दिखता। नमी इसे जोखिम भरा बनाती है।",
      dryNote: "तापमान लू की आधिकारिक सीमा पार कर रहा है। सूखी गर्मी भी ख़तरनाक है: वेट-बल्ब कम होने पर भी लू की सरकारी सलाह मानें।",
      avoid: "इन घंटों में भारी काम से बचें",
      noAvoid: "इस दिन वेट-बल्ब के हिसाब से कोई ज़्यादा जोखिम वाला घंटा नहीं।",
      noData: "इस दिन का डेटा नहीं है।",
      hourly: "घंटे-दर-घंटे (वेट-बल्ब °C)",
      now: "अभी",
      share: "WhatsApp पर भेजें",
      realDay: "असली गर्मी का दिन देखें",
      citedChip: "समाचार रिपोर्ट", replayChip: "रीप्ले",
      adviceTitle: "अगर किसी को गर्मी से तकलीफ़ हो",
      advice: [
        "व्यक्ति को छाँव में किसी ठंडी जगह ले जाएँ।",
        "पानी या ORS जैसा पेय दें (अगर व्यक्ति होश में हो)।",
        "शराब, चाय-कॉफ़ी (कैफ़ीन) या कोल्ड ड्रिंक न दें।",
        "हवा लगने के लिए कपड़े ढीले करें।"
      ],
      adviceSrc: "स्रोत: NDMA लू दिशानिर्देश,",
      emergency: "आपातकाल: 112 पर, या एम्बुलेंस के लिए 108 पर कॉल करें।",
      howTitle: "यह कैसे काम करता है",
      how: [
        "वेट-बल्ब तापमान गर्मी और नमी दोनों को जोड़ता है: इससे पता चलता है कि पसीना शरीर को कितना ठंडा कर सकता है। आम तौर पर बताई जाने वाली सीमाएँ: 30 °C से कम कम जोखिम, 30–35 °C शरीर ज़्यादा गर्म होने का ख़तरा, 35 °C और ऊपर जानलेवा सीमा के पास। 2021 के एक अध्ययन के अनुसार नम हवा में यह सीमा कम हो सकती है।",
        "भारत में लू सिर्फ़ तापमान से घोषित होती है: मैदानी इलाकों में 40 °C, तट पर 37 °C, पहाड़ों में 30 °C, साथ में सामान्य से 4.5 °C ज़्यादा। 45 °C पर अपने-आप लू मानी जाती है। वेट-बल्ब की गणना नहीं होती।",
        "हम Open-Meteo के तापमान और नमी से Stull (2011) फ़ॉर्मूले द्वारा हर घंटे का वेट-बल्ब अनुमान लगाते हैं (त्रुटि लगभग −1 से +0.65 °C)। यह जाँच का साधन है, डॉक्टरी सलाह नहीं।"
      ],
      footer: "यह अनुमान है, डॉक्टरी सलाह नहीं।",
      footerData: "मौसम डेटा:",
      shareMsg: "गर्मी चेक: {place}, {date}\nथर्मामीटर: {temp} °C ({verdict})\nशरीर पर असर (वेट-बल्ब): {wbt} °C, {band}\n{avoid}\nयह अनुमान है, डॉक्टरी सलाह नहीं।\n{url}",
      shareAvoid: "भारी काम से बचें: {ranges}",
      shareNoAvoid: "वेट-बल्ब के हिसाब से कोई ज़्यादा जोखिम वाला घंटा नहीं।"
    }
  };

  var GLYPH = { lower: "●", high: "▲", extreme: "◆", none: "–" };

  var state = {
    lang: "en",
    cityId: "chennai",
    loc: null,            // {lat, lon} when using browser location
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
  function city(id) { return CITIES.find(function (c) { return c.id === id; }); }
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

  function currentPlace() {
    if (state.view !== "live") {
      var ex = example(state.exampleId), c = city(ex.city);
      return { name: c[state.lang], lat: c.lat, lon: c.lon, region: c.region };
    }
    if (state.loc) {
      return { name: t("yourLocation"), lat: state.loc.lat, lon: state.loc.lon, region: state.region };
    }
    var cc = city(state.cityId);
    return { name: cc[state.lang], lat: cc.lat, lon: cc.lon, region: cc.region };
  }

  // ---------- data ----------

  function fetchData() {
    var place = currentPlace();
    state.error = null;
    if (state.view === "cited") {
      var ex = example(state.exampleId);
      state.data = { mode: "cited", days: [{ date: ex.date, thermometer: ex.thermometer, body: ex.body, avoid: null, hours: [] }] };
      state.dayIndex = 0;
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
      return '<option value="' + c.id + '">' + esc(c[state.lang]) + "</option>";
    }).join("") + (state.loc ? '<option value="__loc">📍 ' + esc(t("yourLocation")) + "</option>" : "");
    sel.value = state.loc ? "__loc" : state.cityId;
    $("regionRow").hidden = !state.loc;
    $("adviceList").innerHTML = t("advice").map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");
    $("howList").innerHTML = t("how").map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");

    $("realDays").innerHTML = CITED.concat(REPLAYS).map(function (e) {
      var c = city(e.city), cited = e.id.indexOf("cited") === 0;
      return '<button type="button" data-example="' + e.id + '" aria-pressed="' + (state.exampleId === e.id && state.view !== "live") + '">' +
        esc(c[state.lang]) + ", " + esc(fmtDate(e.date, { day: "numeric", month: "short", year: "numeric" })) +
        " <small>(" + esc(cited ? t("citedChip") : t("replayChip")) + ")</small></button>";
    }).join("");
  }

  function headlineHtml(day) {
    var b = day.body, band = b ? b.band : "none";
    var sub = "";
    if (b) {
      sub = fill(b.at ? t("peak") : t("peakNoTime"), { wbt: b.max_wbt_c.toFixed(1), time: b.at, temp: Number(b.temp_c).toFixed(1), rh: b.rh });
    }
    return '<div class="headline b-' + band + '"><div class="glyph" aria-hidden="true">' + GLYPH[band] + "</div><div>" +
      "<strong>" + esc(b ? t("headline")[band] : t("noData")) + "</strong><span>" + esc(sub) + "</span></div></div>";
  }

  function compareHtml(day, place) {
    var th = day.thermometer, b = day.body;
    if (!th || !b) return "";
    var verdict = fill(t("verdict")[th.verdict], { t: th.threshold_c, region: t("regionName")[place.region] });
    return '<div class="compare">' +
      '<div class="card"><div class="k">🌡️ ' + esc(t("thermoSays")) + "</div>" +
      '<div class="num">' + th.max_temp_c.toFixed(1) + "°C</div>" +
      '<div class="unit">' + esc(t("highestTemp")) + "</div>" +
      '<div class="v">' + esc(verdict) + "</div></div>" +
      '<div class="card body b-' + b.band + '"><div class="k">💧 ' + esc(t("bodyFeels")) + "</div>" +
      '<div class="num">' + b.max_wbt_c.toFixed(1) + "°C</div>" +
      '<div class="unit">' + esc(t("wetBulb")) + "</div>" +
      '<div class="chip b-' + b.band + '" style="border:1px solid currentColor">' + GLYPH[b.band] + " " + esc(t("band")[b.band]) + "</div>" +
      '<div class="v">' + esc(t("bandDesc")[b.band]) + "</div></div>" +
      "</div>";
  }

  function notesHtml(day) {
    var th = day.thermometer, b = day.body;
    if (!th || !b) return "";
    if (th.verdict === "below_threshold" && b.band !== "lower") {
      return '<div class="note gap">⚠️ ' + esc(t("gapNote")) + "</div>";
    }
    if (th.verdict !== "below_threshold" && b.band === "lower") {
      return '<div class="note dry">⚠️ ' + esc(t("dryNote")) + "</div>";
    }
    return "";
  }

  function rangesText(avoid) {
    return avoid.map(function (w) { return w.from + "–" + w.to; }).join(", ");
  }

  function avoidHtml(day) {
    if (!day.avoid) return "";
    if (!day.avoid.length) {
      return '<div class="avoid"><div class="ic" aria-hidden="true">🕑</div><div>' + esc(t("noAvoid")) + "</div></div>";
    }
    return '<div class="avoid"><div class="ic" aria-hidden="true">🕑</div><div><strong>' + esc(t("avoid")) +
      '</strong><span class="ranges">' + esc(rangesText(day.avoid)) + "</span></div></div>";
  }

  function stripHtml(day) {
    if (!day.hours || !day.hours.length) return "";
    var nowKey = state.view === "live" ? istNow() : null;
    var tiles = day.hours.map(function (h) {
      var band = h.band || "none", key = h.time.slice(0, 13);
      var cls = "hour b-" + band + (nowKey && key < nowKey ? " past" : "") + (nowKey && key === nowKey ? " now" : "");
      var label = h.time.slice(11, 13) + ":00";
      var title = label + " · " + (h.temp_c != null ? h.temp_c + " °C, " + h.rh + "% · " : "") +
        (h.band ? t("band")[h.band] : "");
      return '<div class="' + cls + '" title="' + esc(title) + '" aria-label="' + esc(title) + '">' +
        '<div class="h">' + (nowKey && key === nowKey ? esc(t("now")) : h.time.slice(11, 13)) + "</div>" +
        '<div class="g" aria-hidden="true">' + GLYPH[band] + "</div>" +
        '<div class="w">' + (h.wbt_c != null ? h.wbt_c.toFixed(1) : "–") + "</div></div>";
    }).join("");
    var legend = ["lower", "high", "extreme"].map(function (b) {
      return '<span class="b-' + b + '" style="background:none"><b>' + GLYPH[b] + "</b> " + esc(t("band")[b]) + "</span>";
    }).join("");
    return "<h2>" + esc(t("hourly")) + '</h2><div class="strip" id="strip">' + tiles + '</div><div class="legend">' + legend + "</div>";
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
    var note = state.view === "live" ? t("liveNote") : state.view === "replay" ? t("replayNote") : t("citedNote");
    $("modeNote").textContent = note;
    $("backLive").hidden = state.view === "live";

    var out = '<p class="place">' + esc(place.name) + "</p>";
    if (state.loading) {
      $("result").innerHTML = out + '<div class="loading">' + esc(t("loading")) + "</div>";
      return;
    }
    if (state.error) {
      $("result").innerHTML = out + '<div class="error"><strong>' + esc(t("error")) + "</strong><br>" + esc(state.error) +
        '<div style="margin-top:8px"><button type="button" class="btn" id="retry">' + esc(t("retry")) + "</button></div></div>";
      $("retry").onclick = fetchData;
      return;
    }
    if (!state.data) { $("result").innerHTML = out; return; }

    var days = state.data.days || [];
    var day = days[state.dayIndex] || days[0];
    if (!day) { $("result").innerHTML = out + '<div class="error">' + esc(t("noData")) + "</div>"; return; }

    if (state.view === "live" && days.length > 1) {
      out += '<div class="tabs" role="tablist">' + days.slice(0, 2).map(function (d, i) {
        return '<button type="button" role="tab" data-day="' + i + '" aria-selected="' + (i === state.dayIndex) + '">' +
          esc(i === 0 ? t("today") : t("tomorrow")) + " · " + esc(fmtDate(d.date, { day: "numeric", month: "short" })) + "</button>";
      }).join("") + "</div>";
    } else {
      out += '<div class="label" style="margin-top:4px">' + esc(fmtDate(day.date)) + "</div>";
    }

    out += headlineHtml(day) + compareHtml(day, place) + notesHtml(day) + avoidHtml(day);
    if (state.view === "live" && day.body && day.body.band === "lower") {
      out += '<div class="note">' + esc(t("calmHint")) + "</div>";
    }
    out += stripHtml(day);
    if (day.body && day.thermometer) {
      out += '<a class="btn share" id="share" target="_blank" rel="noopener" href="https://wa.me/?text=' +
        encodeURIComponent(shareText(day, place)) + '">' + esc(t("share")) + "</a>";
    }
    $("result").innerHTML = out;

    document.querySelectorAll("[data-day]").forEach(function (b) {
      b.onclick = function () { state.dayIndex = Number(b.getAttribute("data-day")); render(); };
    });
    // Scroll the strip so the current or first risky hour is visible.
    var strip = $("strip");
    if (strip) {
      var target = strip.querySelector(".now") || strip.querySelector(".b-extreme, .b-high");
      if (target) strip.scrollLeft = Math.max(0, target.offsetLeft - strip.offsetLeft - 60);
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
        state.loc = { lat: pos.coords.latitude.toFixed(2), lon: pos.coords.longitude.toFixed(2) };
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
