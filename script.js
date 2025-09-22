/* =====================================================================
   Safer, defensive script (fixed):
   - Works on BOTH index.html and weather-details.html
   - Guards for missing elements
   - Proper Chart.js options placement
   ===================================================================== */

/* ------------------------------
   DOM helpers
   ------------------------------ */
const $ = (id) => document.getElementById(id);

/* Airports */
const airports = {
  KMCO: { name: "Orlando Intl (KMCO)", lat: 28.4312, lon: -81.3081 },
  KSFB: { name: "Sanford Intl (KSFB)", lat: 28.7776, lon: -81.2375 },
  KJAX: { name: "Jacksonville Intl (KJAX)", lat: 30.4941, lon: -81.6879 },
  KMIA: { name: "Miami Intl (KMIA)", lat: 25.7959, lon: -80.2870 },
};

const icons = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
  51: "🌦️", 53: "🌧️", 55: "🌧️", 56: "🌧️", 57: "🌧️",
  61: "🌧️", 63: "🌧️", 65: "🌧️", 66: "🌧️", 67: "🌧️",
  71: "❄️", 73: "❄️", 75: "❄️", 77: "❄️", 80: "🌧️",
  81: "🌧️", 82: "🌧️", 85: "❄️", 86: "❄️", 95: "⛈️", 96: "⛈️", 99: "⛈️"
};

/* State */
let tempChart, windChart;
let lastForecast = [];
let lastCurrent = {};

/* Elements */
const select = $("icao-select");
const airportNameEl = $("airport-name");
const currentWeatherEl = $("current-weather");
const forecastContainer = $("forecast-days") || $("forecast");
const rawJsonEl = $("raw-json");
const tempToggle = $("temp-toggle");
const windToggle = $("wind-toggle");

/* Populate selector */
if (select) {
  Object.entries(airports).forEach(([code, data]) => {
    const opt = document.createElement("option");
    opt.value = code; opt.textContent = data.name;
    select.appendChild(opt);
  });
  if (!select.value) select.value = "KMCO";
  select.addEventListener("change", () => loadWeather(select.value));
}
if (tempToggle) tempToggle.addEventListener("change", () => renderAll());
if (windToggle) windToggle.addEventListener("change", () => renderAll());

/* Unit helpers */
function convertTemp(c) {
  if (typeof c !== "number") return "—";
  return tempToggle && tempToggle.checked ? (c * 9/5 + 32).toFixed(1) : c.toFixed(1);
}
function convertWind(kmh) {
  if (typeof kmh !== "number") return "—";
  return windToggle && windToggle.checked ? (kmh / 1.609).toFixed(1) : kmh.toFixed(1);
}
function unitLabel(kind) {
  if (kind === 'temp') return (tempToggle && tempToggle.checked) ? '°F' : '°C';
  return (windToggle && windToggle.checked) ? 'mph' : 'km/h';
}

/* Rendering */
function renderAll() {
  renderCurrent();
  renderForecast(lastForecast);
  drawCharts(lastForecast);
}
function renderCurrent() {
  if (!currentWeatherEl || !lastCurrent || typeof lastCurrent.temperature === "undefined") return;
  const cw = lastCurrent;
  currentWeatherEl.innerHTML =
    `Temperature: ${convertTemp(cw.temperature)}${unitLabel('temp')}<br>
     Windspeed: ${convertWind(cw.windspeed)} ${unitLabel('wind')}<br>
     Condition: ${icons[cw.weathercode] || "—"} (Code ${cw.weathercode})`;
}
function renderForecast(data) {
  if (!forecastContainer || !Array.isArray(data)) return;
  forecastContainer.innerHTML = data.map(day => `
    <div class="day-card">
      <strong>${day.date}</strong><br>
      <div style="font-size:2rem;">${icons[day.code] || "🌈"}</div>
      High: ${convertTemp(day.high)}${unitLabel('temp')}<br>
      Low: ${convertTemp(day.low)}${unitLabel('temp')}<br>
      Precip: ${day.precip} mm<br>
      Wind: ${convertWind(day.wind)} ${unitLabel('wind')}
    </div>`).join("");
}
function drawCharts(data) {
  const tempCanvas = document.getElementById("tempChart");
  const windCanvas = document.getElementById("windChart");
  if (!tempCanvas || !windCanvas || !Array.isArray(data) || !window.Chart) return;

  const labels = data.map(d => d.date);
  const highs = data.map(d => Number(convertTemp(d.high)));
  const lows  = data.map(d => Number(convertTemp(d.low)));
  const wind  = data.map(d => Number(convertWind(d.wind)));

  if (tempChart) tempChart.destroy();
  if (windChart) windChart.destroy();

  tempChart = new Chart(tempCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: `High Temp (${unitLabel('temp')})`, data: highs, fill: false },
        { label: `Low Temp (${unitLabel('temp')})`,  data: lows,  fill: false }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  windChart = new Chart(windCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: `Wind Speed (${unitLabel('wind')})`, data: wind }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

/* Data loading */
function loadWeather(code) {
  const airport = airports[code] || airports["KMCO"];
  if (airportNameEl) airportNameEl.textContent = airport.name;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${airport.lat}&longitude=${airport.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&past_days=7&forecast_days=7&timezone=America/New_York`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      lastForecast = (data.daily?.time || []).map((day, i) => ({
        date: day,
        high: data.daily.temperature_2m_max[i],
        low:  data.daily.temperature_2m_min[i],
        precip: data.daily.precipitation_sum[i],
        wind: data.daily.windspeed_10m_max[i],
        code: data.daily.weathercode[i]
      }));
      lastCurrent = data.current_weather || {};
      if (typeof renderRawTables === "function") renderRawTables(data);
      if (rawJsonEl) rawJsonEl.textContent = JSON.stringify(data, null, 2);
      renderAll();
    })
    .catch(err => {
      if (rawJsonEl) rawJsonEl.textContent = String(err);
      console.error(err);
    });
}

/* Boot */
(function init() {
  if (select) {
    select.value = select.value || "KMCO";
    loadWeather(select.value);
    setInterval(() => loadWeather(select.value), 10 * 60 * 1000);
  }
})();

/* Export PDF */
function exportForecast() {
  if (!window.jspdf || !Array.isArray(lastForecast)) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Airport Weather Forecast`, 10, 10);
  lastForecast.forEach((d, i) => {
    doc.text(`${d.date} — High: ${convertTemp(d.high)}${unitLabel('temp')}, Low: ${convertTemp(d.low)}${unitLabel('temp')}, Precip: ${d.precip}mm, Wind: ${convertWind(d.wind)} ${unitLabel('wind')}`, 10, 20 + i * 10);
  });
  doc.save("weather-forecast.pdf");
}
window.exportForecast = exportForecast;
