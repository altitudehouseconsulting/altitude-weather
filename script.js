const airports = {
  KMCO: { name: "Orlando Intl (KMCO)", lat: 28.4312, lon: -81.3081 },
  KSFB: { name: "Sanford Intl (KSFB)", lat: 28.7776, lon: -81.2375 },
  KJAX: { name: "Jacksonville Intl (KJAX)", lat: 30.4941, lon: -81.6879 },
  KMIA: { name: "Miami Intl (KMIA)", lat: 25.7959, lon: -80.2870 },
};

const icaoSelect = document.getElementById('icao-select');
const airportNameEl = document.getElementById('airport-name');
const currentWeatherEl = document.getElementById('current-weather');
const forecastEl = document.getElementById('forecast');

Object.entries(airports).forEach(([code, data]) => {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = data.name;
  icaoSelect.appendChild(option);
});

icaoSelect.addEventListener('change', () => {
  const code = icaoSelect.value;
  loadWeather(code);
});

function loadWeather(code) {
  const airport = airports[code];
  airportNameEl.textContent = airport.name;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${airport.lat}&longitude=${airport.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=America/New_York`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const cw = data.current_weather;
      currentWeatherEl.innerHTML = `Temperature: ${cw.temperature}°C<br>Windspeed: ${cw.windspeed} km/h<br>Weather Code: ${cw.weathercode}`;

      const days = data.daily.time.map((day, idx) => {
        return `${day}: High ${data.daily.temperature_2m_max[idx]}°C, Low ${data.daily.temperature_2m_min[idx]}°C, Precip: ${data.daily.precipitation_sum[idx]}mm, Wind: ${data.daily.windspeed_10m_max[idx]} km/h`;
      }).join('<br>');
      forecastEl.innerHTML = days;
    })
    .catch(err => {
      currentWeatherEl.textContent = 'Error loading data.';
      forecastEl.textContent = '';
      console.error(err);
    });
}

function openFullReport() {
  alert("This will be replaced by a detailed view.");
}

icaoSelect.value = "KMCO";
loadWeather("KMCO");