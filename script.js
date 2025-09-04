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

let tempChart, windChart;
let lastForecast = [];
let lastCurrent = {};

const select = document.getElementById("icao-select");
const forecastContainer = document.getElementById("forecast-days");
const currentWeatherEl = document.getElementById("current-weather");
const rawJsonEl = document.getElementById("raw-json");
const airportNameEl = document.getElementById("airport-name");
const tempToggle = document.getElementById("temp-toggle");
const windToggle = document.getElementById("wind-toggle");

Object.entries(airports).forEach(([code, data]) => {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = data.name;
  select.appendChild(option);
});

select.addEventListener("change", () => loadWeather(select.value));
tempToggle.addEventListener("change", () => renderAll());
windToggle.addEventListener("change", () => renderAll());

function convertTemp(c) {
  return tempToggle.checked ? (c * 9 / 5 + 32).toFixed(1) : c.toFixed(1);
}
function convertWind(kmh) {
  return windToggle.checked ? (kmh / 1.609).toFixed(1) : kmh.toFixed(1);
}
function unitLabel(type) {
  return type === 'temp' ? (tempToggle.checked ? '°F' : '°C') : (windToggle.checked ? 'mph' : 'km/h');
}

function renderAll() {
  renderCurrent();
  renderForecast(lastForecast);
  drawCharts(lastForecast);
}

function loadWeather(code) {
  const airport = airports[code];
  airportNameEl.textContent = airport.name;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${airport.lat}&longitude=${airport.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&past_days=7&forecast_days=7&timezone=America/New_York`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      lastForecast = data.daily.time.map((day, i) => ({
        date: day,
        high: data.daily.temperature_2m_max[i],
        low: data.daily.temperature_2m_min[i],
        precip: data.daily.precipitation_sum[i],
        wind: data.daily.windspeed_10m_max[i],
        code: data.daily.weathercode[i]
      }));
      lastCurrent = data.current_weather;
      rawJsonEl.textContent = JSON.stringify(data, null, 2);
      renderAll();
    });
}

function renderCurrent() {
  const cw = lastCurrent;
  currentWeatherEl.innerHTML = `Temperature: ${convertTemp(cw.temperature)}${unitLabel('temp')}<br>Windspeed: ${convertWind(cw.windspeed)} ${unitLabel('wind')}<br>Condition: ${icons[cw.weathercode] || "—"} (Code ${cw.weathercode})`;
}

function renderForecast(data) {
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
  const labels = data.map(d => d.date);
  const highs = data.map(d => +convertTemp(d.high));
  const lows = data.map(d => +convertTemp(d.low));
  const wind = data.map(d => +convertWind(d.wind));

  if (tempChart) tempChart.destroy();
  if (windChart) windChart.destroy();

  tempChart = new Chart(document.getElementById("tempChart"), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: `High Temp (${unitLabel('temp')})`, data: highs, borderColor: 'red', fill: false },
        { label: `Low Temp (${unitLabel('temp')})`, data: lows, borderColor: 'blue', fill: false }
      ]
    }
  });

  windChart = new Chart(document.getElementById("windChart"), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: `Wind Speed (${unitLabel('wind')})`, data: wind, backgroundColor: 'skyblue' }]
    }
  });
}

function exportForecast() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(`Airport Weather Forecast`, 10, 10);
  lastForecast.forEach((d, i) => {
    doc.text(`${d.date} — High: ${convertTemp(d.high)}${unitLabel('temp')}, Low: ${convertTemp(d.low)}${unitLabel('temp')}, Precip: ${d.precip}mm, Wind: ${convertWind(d.wind)} ${unitLabel('wind')}`, 10, 20 + i * 10);
  });
  doc.save("weather-forecast.pdf");
}

select.value = "KMCO";
loadWeather("KMCO");
setInterval(() => loadWeather(select.value), 10 * 60 * 1000);