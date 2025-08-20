let weatherData = {
  metar: { raw: '', translated: '', showingRaw: false, decoded: {} },
  taf: { raw: '', translated: '', showingRaw: false, decoded: {} }
};

function toggleDisplay(type) {
  const el = document.getElementById(type);
  weatherData[type].showingRaw = !weatherData[type].showingRaw;
  el.textContent = weatherData[type].showingRaw ? weatherData[type].raw : weatherData[type].translated;

  const button = el.previousElementSibling;
  button.textContent = weatherData[type].showingRaw ? 'View Translated' : 'View Raw';
}

function toggleTable(type) {
  const table = document.getElementById(`${type}-table`);
  const isVisible = table.style.display === 'table';
  table.style.display = isVisible ? 'none' : 'table';

  if (!isVisible) {
    const data = weatherData[type].decoded;
    let html = '<tr><th>Field</th><th>Value</th><th>Description</th></tr>';
    for (const [key, field] of Object.entries(data)) {
      if (field && field.repr) {
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

function toggleDefinitions() {
  const box = document.getElementById('wx-definitions');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

const icaoSelect = document.getElementById('icao-select');
const airportName = document.getElementById('airport-name');
const metarEl = document.getElementById('metar');
const tafEl = document.getElementById('taf');

const airportMap = {
  'KMIA': 'Miami, FL (KMIA)',
  'KATL': 'Atlanta, GA (KATL)',
  'KMSY': 'New Orleans, LA (KMSY)',
  'KDFW': 'Dallas/Fort Worth, TX (KDFW)',
  'KBNA': 'Nashville, TN (KBNA)',
  'KSDF': 'Louisville, KY (KSDF)',
  'MMMX': 'Mexico City, MX (MMMX)',
  'MGGT': 'Guatemala City, GT (MGGT)',
  'MUHA': 'Havana, CU (MUHA)',
  'TJSJ': 'San Juan, PR (TJSJ)'
  'KSFB': 'Sanford, FL (KSFB)'
};

const API_KEY = 'glW3LNiEIa1bKVWjgjg_U4RcbAdhusDhO6JOwN9rLbM';
const headers = {Authorization: `Bearer ${API_KEY}`};

function fetchWeather(icao) {
  // METAR
  fetch(`https://avwx.rest/api/metar/${icao}?format=json&translate=true`, { headers })
    .then(res => res.json())
    .then(data => {
      weatherData.metar.raw = data.raw || 'No METAR available.';
      weatherData.metar.translated = data.sanitized || 'No METAR available.';
      weatherData.metar.decoded = data || {};
      weatherData.metar.showingRaw = false;
      document.getElementById('metar').textContent = weatherData.metar.translated;
      document.querySelector('button[onclick*="metar"]').textContent = 'View Raw';
    });

  // TAF
  fetch(`https://avwx.rest/api/taf/${icao}?format=json&translate=true`, { headers })
    .then(res => res.json())
    .then(data => {
      weatherData.taf.raw = data.raw || 'No TAF available.';
      weatherData.taf.translated = data.sanitized || 'No TAF available.';
      weatherData.taf.decoded = data || {};
      weatherData.taf.showingRaw = false;
      document.getElementById('taf').textContent = weatherData.taf.translated;
      document.querySelector('button[onclick*="taf"]').textContent = 'View Raw';
    });
}

icaoSelect.addEventListener('change', () => {
  const selected = icaoSelect.value;
  airportName.textContent = airportMap[selected];
  fetchWeather(selected);
});

// Load default
fetchWeather(icaoSelect.value);
