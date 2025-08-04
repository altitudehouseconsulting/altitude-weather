document.addEventListener('DOMContentLoaded', function () {
  const select = document.getElementById('location-select');
  const forecastDiv = document.getElementById('forecast');

  function getWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    forecastDiv.innerHTML = '<p>Loading...</p>';

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const daily = data.daily;
        const todayIndex = 0;

        const html = `
          <p><strong>Date:</strong> ${daily.time[todayIndex]}</p>
          <p><strong>Max Temp:</strong> ${daily.temperature_2m_max[todayIndex]}°C</p>
          <p><strong>Min Temp:</strong> ${daily.temperature_2m_min[todayIndex]}°C</p>
          <p><strong>Precipitation:</strong> ${daily.precipitation_sum[todayIndex]} mm</p>
        `;

        forecastDiv.innerHTML = html;
      })
      .catch(error => {
        forecastDiv.innerHTML = `<p style="color: red;">Error fetching weather data.</p>`;
        console.error('Weather API error:', error);
      });
  }

  function onLocationChange() {
    const [lat, lon] = select.value.split(',');
    getWeather(lat, lon);
  }

  select.addEventListener('change', onLocationChange);

  // Initial load
  onLocationChange();
});
  
