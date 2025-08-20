// Replace with your actual AVWX API key
const API_KEY = 'glW3LNiEIa1bKVWjgjg_U4RcbAdhusDhO6JOwN9rLbM';
const headers = {
  Authorization: `Bearer ${API_KEY}`
};

// DOM elements
const icaoSelect = document.getElementById('icao-select');
const metarEl = document.getElementById('metar');
const tafEl = document.getElementById('taf');

// State holder
let weatherData = {
  metar: { raw: '', translated: '', showingRaw: false, decoded: {} },
  taf: { raw: '', translated: '', showingRaw: false, decoded: {} }
};

// Toggle between raw and translated view
function toggleDisplay(type) {
  const el = document.getElementById(type);
  weatherData[type].showingRaw = !weatherData[type].showingRaw;
  el.textContent = weatherData[type].showingRaw
    ? weatherData[type].raw
    : weatherData[type].translated;

  const button = el.previousElementSibling;
  button.textContent = weatherData[type].showingRaw ? 'View Translated' : 'View Raw';
}

// Toggle decoded table
function toggleTable(type) {
  const table = document.getElementById(`${type}-table`);
  const isVisible = table.style.display === 'table';
  table.style.display = isVisible ? 'none' : 'table';

  if (!isVisible) {
    const data = weatherData[type].decoded;
    let html = '<tr><th>Field</th><th>Code</th><th>Description</th></tr>';
    for (const [key, field] of Object.entries(data)) {
      if (field && typeof field === 'object' && field.repr) {
        html += `<tr>
          <td>${key.replace(/_/g, ' ')}</td>
          <td>${field.repr}</td>
          <td>${field.spoken || '—'}</td>
        </tr>`;
      }
    }
    table.innerHTML = html;
  }
}

// Toggle "What does this mean?" block
function toggleDefinitions() {
  const box = document.getElementById('wx-definitions');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

// Fetch METAR and TAF
function fetchWeather(icao) {
  console.log("Fetching data for:", icao);

  // Fetch METAR
  fetch(`https://avwx.rest/api/metar/${icao}?format=json&translate=true`, { headers })
    .then(res => {
      if (!res.ok) throw new Error(`METAR fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log("METAR data:", data);
      weatherData.metar.raw = data.raw || 'No METAR available.';
      weatherData.metar.translated = data.sanitized || 'No METAR available.';
      weatherData.metar.decoded = data || {};
      weatherData.metar.showingRaw = false;
      metarEl.textContent = weatherData.metar.translated;
      document.querySelector('button[onclick*="metar"]').textContent = 'View Raw';
    })
    .catch(err => {
      console.error("METAR error:", err);
      metarEl.textContent = 'Error loading METAR.';
    });

  // Fetch TAF
  fetch(`https://avwx.rest/api/taf/${icao}?format=json&translate=true`, { headers })
    .then(res => {
      if (!res.ok) throw new Error(`TAF fetch failed: ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log("TAF data:", data);
      weatherData.taf.raw = data.raw || 'No TAF available.';
      weatherData.taf.translated = data.sanitized || 'No TAF available.';
      weatherData.taf.decoded = data || {};
      weatherData.taf.showingRaw = false;
      tafEl.textContent = weatherData.taf.translated;
      document.querySelector('button[onclick*="taf"]').textContent = 'View Raw';
    })
    .catch(err => {
      console.error("TAF error:", err);
      tafEl.textContent = 'Error loading TAF.';
    });
}

// Load on dropdown change
icaoSelect.addEventListener('change', () => {
  const selected = icaoSelect.value;
  fetchWeather(selected);
});

// Load default on page load
fetchWeather(icaoSelect.value);
