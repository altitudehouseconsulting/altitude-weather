
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
};

const API_KEY = 'DEMO_KEY'; // Replace with your real AVWX API key
const headers = { Authorization: `Bearer ${API_KEY}` };

function fetchWeather(icao) {
  fetch(`https://avwx.rest/api/metar/${icao}?format=json`, { headers })
    .then(res => res.json()).then(data => {
      metarEl.textContent = data.raw || 'No METAR available.';
    }).catch(() => metarEl.textContent = 'Error loading METAR.');

  fetch(`https://avwx.rest/api/taf/${icao}?format=json`, { headers })
    .then(res => res.json()).then(data => {
      tafEl.textContent = data.raw || 'No TAF available.';
    }).catch(() => tafEl.textContent = 'Error loading TAF.');
}

icaoSelect.addEventListener('change', () => {
  const selected = icaoSelect.value;
  airportName.textContent = airportMap[selected];
  fetchWeather(selected);
});

// Load default
fetchWeather(icaoSelect.value);
