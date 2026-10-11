// Preset cities and "real heat day" examples for Garmi Check.

window.CITIES = [
  { id: "chennai", en: "Chennai", hi: "चेन्नई", state_en: "Tamil Nadu", state_hi: "तमिलनाडु", lat: 13.08, lon: 80.27, region: "coastal" },
  { id: "mumbai", en: "Mumbai", hi: "मुंबई", state_en: "Maharashtra", state_hi: "महाराष्ट्र", lat: 19.08, lon: 72.88, region: "coastal" },
  { id: "visakhapatnam", en: "Visakhapatnam", hi: "विशाखापत्तनम", state_en: "Andhra Pradesh", state_hi: "आंध्र प्रदेश", lat: 17.69, lon: 83.22, region: "coastal" },
  { id: "kochi", en: "Kochi", hi: "कोच्चि", state_en: "Kerala", state_hi: "केरल", lat: 9.93, lon: 76.27, region: "coastal" },
  { id: "delhi", en: "Delhi", hi: "दिल्ली", state_en: "NCT", state_hi: "एनसीटी", lat: 28.61, lon: 77.21, region: "plains" },
  { id: "nagpur", en: "Nagpur", hi: "नागपुर", state_en: "Maharashtra", state_hi: "महाराष्ट्र", lat: 21.15, lon: 79.09, region: "plains" },
  { id: "solapur", en: "Solapur", hi: "सोलापुर", state_en: "Maharashtra", state_hi: "महाराष्ट्र", lat: 17.66, lon: 75.91, region: "plains" },
  { id: "jalgaon", en: "Jalgaon", hi: "जलगाँव", state_en: "Maharashtra", state_hi: "महाराष्ट्र", lat: 21.01, lon: 75.56, region: "plains" },
];

// Single midday readings cited by Down To Earth (28 Mar 2024). Results computed
// with backend/heat.py summarize_reading(); there is no hourly data for these.
window.CITED = [
  {
    id: "cited-solapur", city: "solapur", date: "2024-03-28",
    thermometer: { max_temp_c: 40, threshold_c: 40, auto_c: 45, verdict: "meets_threshold" },
    body: { max_wbt_c: 31.5, band: "high", temp_c: 40, rh: 53 },
  },
  {
    id: "cited-jalgaon", city: "jalgaon", date: "2024-03-28",
    thermometer: { max_temp_c: 46.8, threshold_c: 40, auto_c: 45, verdict: "heatwave_by_temp" },
    body: { max_wbt_c: 30.7, band: "high", temp_c: 46.8, rh: 29 },
  },
];

// Archive replay days found with scripts/find_replay_days.py (Open-Meteo ERA5,
// April-June 2024-2026). Model data, so values differ from station readings.
window.REPLAYS = [
  { id: "replay-chennai", city: "chennai", date: "2024-06-01" },      // 36.8 C, below 37 C coastal mark; wet-bulb 30.3 high
  { id: "replay-vizag", city: "visakhapatnam", date: "2024-05-30" },  // 36.3 C, below mark; wet-bulb 30.0 high
  { id: "replay-vizag-2026", city: "visakhapatnam", date: "2026-05-21" }, // 40.3 C; wet-bulb 30.5, five risky hours
];
