/* =====================================================================
   Consolidated, defensive script
   ===================================================================== */
const $ = (id) => document.getElementById(id);

const airports = {
  KMCO:{name:"Orlando Intl (KMCO)",lat:28.4312,lon:-81.3081},
  KSFB:{name:"Sanford Intl (KSFB)",lat:28.7776,lon:-81.2375},
  KJAX:{name:"Jacksonville Intl (KJAX)",lat:30.4941,lon:-81.6879},
  KMIA:{name:"Miami Intl (KMIA)",lat:25.7959,lon:-80.2870},
};

const icons={0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",51:"🌦️",53:"🌧️",55:"🌧️",56:"🌧️",57:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",66:"🌧️",67:"🌧️",71:"❄️",73:"❄️",75:"❄️",77:"❄️",80:"🌧️",81:"🌧️",82:"🌧️",85:"❄️",86:"❄️",95:"⛈️",96:"⛈️",99:"⛈️"};

let tempChart, windChart;
let lastForecast=[], lastCurrent={};

const select=$("icao-select");
const airportNameEl=$("airport-name");
const currentWeatherEl=$("current-weather");
const forecastContainer=$("forecast-days")||$("forecast");
const rawJsonEl=$("raw-json");
const tempToggle=$("temp-toggle");
const windToggle=$("wind-toggle");

/* Populate selector defensively */
if(select){
  while(select.firstChild) select.removeChild(select.firstChild);
  const ph=document.createElement("option"); ph.value=""; ph.textContent="-- Select Airport --"; select.appendChild(ph);
  const entries=Object.entries(airports||{});
  entries.forEach(([code,data])=>{ const o=document.createElement("option"); o.value=code; o.textContent=data?.name||code; select.appendChild(o); });
  if(!select.value||select.value===""){ const kmco=entries.find(([k])=>k==="KMCO"); select.value=kmco?"KMCO":(entries[0]?.[0]||""); }
  select.addEventListener("change",()=>loadWeather(select.value));
}
if(tempToggle) tempToggle.addEventListener("change",()=>renderAll());
if(windToggle) windToggle.addEventListener("change",()=>renderAll());

function convertTemp(c){ if(typeof c!=="number") return "—"; return (tempToggle&&tempToggle.checked)?(c*9/5+32).toFixed(1):c.toFixed(1); }
function convertWind(k){ if(typeof k!=="number") return "—"; return (windToggle&&windToggle.checked)?(k/1.609).toFixed(1):k.toFixed(1); }
function unitLabel(k){ return k==='temp'?(tempToggle&&tempToggle.checked?'°F':'°C'):(windToggle&&windToggle.checked?'mph':'km/h'); }

function renderAll(){ renderCurrent(); renderForecast(lastForecast); drawCharts(lastForecast); }
function renderCurrent(){
  if(!currentWeatherEl||!lastCurrent||typeof lastCurrent.temperature==="undefined") return;
  const cw=lastCurrent;
  currentWeatherEl.innerHTML=`Temperature: ${convertTemp(cw.temperature)}${unitLabel('temp')}<br>
Windspeed: ${convertWind(cw.windspeed)} ${unitLabel('wind')}<br>
Condition: ${icons[cw.weathercode]||"—"} (Code ${cw.weathercode})`;
}
function renderForecast(data){
  if(!forecastContainer||!Array.isArray(data)) return;
  forecastContainer.innerHTML=data.map(d=>`
    <div class="day-card">
      <strong>${d.date}</strong><br>
      <div style="font-size:2rem;">${icons[d.code]||"🌈"}</div>
      High: ${convertTemp(d.high)}${unitLabel('temp')}<br>
      Low: ${convertTemp(d.low)}${unitLabel('temp')}<br>
      Precip: ${d.precip} mm<br>
      Wind: ${convertWind(d.wind)} ${unitLabel('wind')}
    </div>`).join("");
}
function drawCharts(data){
  const t=document.getElementById("tempChart");
  const w=document.getElementById("windChart");
  if(!t||!w||!Array.isArray(data)||!window.Chart) return;
  const labels=data.map(d=>d.date);
  const highs=data.map(d=>Number(convertTemp(d.high)));
  const lows=data.map(d=>Number(convertTemp(d.low)));
  const wind=data.map(d=>Number(convertWind(d.wind)));
  if(tempChart) tempChart.destroy();
  if(windChart) windChart.destroy();
  tempChart=new Chart(t,{type:'line',data:{labels,datasets:[{label:`High Temp (${unitLabel('temp')})`,data:highs,fill:false},{label:`Low Temp (${unitLabel('temp')})`,data:lows,fill:false}]},options:{responsive:true,maintainAspectRatio:false}});
  windChart=new Chart(w,{type:'bar',data:{labels,datasets:[{label:`Wind Speed (${unitLabel('wind')})`,data:wind}]},options:{responsive:true,maintainAspectRatio:false}});
}

/* Raw API -> Tables */
function setContainerHTML(el,html){ if(el) el.innerHTML=html; }
function renderRawTables(api){
  const container=document.getElementById('raw-table-container');
  if(!container||!api) return;
  const cw=api.current_weather||{};
  const currentRows=Object.entries(cw).map(([k,v])=>`<tr><th>${escapeHtml(k)}</th><td>${String(v)}</td></tr>`).join('');
  const currentTable=`<h4 style="margin:0.25rem 0 0.5rem;">Current Weather (raw)</h4>
<table class="raw"><tbody>${currentRows||'<tr><td colspan="2">No data</td></tr>'}</tbody></table>`;
  const d=api.daily||{}; const rows=[]; const N=Array.isArray(d.time)?d.time.length:0;
  for(let i=0;i<N;i++){
    rows.push(`<tr><td>${d.time?.[i]??''}</td><td>${safeNum(d.temperature_2m_max?.[i])}</td><td>${safeNum(d.temperature_2m_min?.[i])}</td><td>${safeNum(d.precipitation_sum?.[i])}</td><td>${safeNum(d.windspeed_10m_max?.[i])}</td><td>${d.weathercode?.[i]??''}</td></tr>`);
  }
  const dailyTable=`<h4 style="margin:1rem 0 0.5rem;">Daily Summary (raw)</h4>
<table class="raw"><thead><tr><th>Date</th><th>Temp Max (°C)</th><th>Temp Min (°C)</th><th>Precip (mm)</th><th>Wind Max (km/h)</th><th>Wx Code</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="6">No data</td></tr>'}</tbody></table>`;
  setContainerHTML(container,currentTable+dailyTable);
  if(rawJsonEl) rawJsonEl.textContent=JSON.stringify(api,null,2);
}
function safeNum(n){ return (typeof n==='number')?n:''; }
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }

function loadWeather(code){
  const airport=airports[code]||airports["KMCO"];
  if(airportNameEl) airportNameEl.textContent=airport.name;
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${airport.lat}&longitude=${airport.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode&past_days=7&forecast_days=7&timezone=America/New_York`;
  fetch(url).then(r=>r.json()).then(data=>{
    lastForecast=(data.daily?.time||[]).map((day,i)=>({
      date:day, high:data.daily.temperature_2m_max[i], low:data.daily.temperature_2m_min[i],
      precip:data.daily.precipitation_sum[i], wind:data.daily.windspeed_10m_max[i], code:data.daily.weathercode[i]
    }));
    lastCurrent=data.current_weather||{};
    renderRawTables(data);
    renderAll();
  }).catch(err=>{ if(rawJsonEl) rawJsonEl.textContent=String(err); console.error(err); });
}

(function init(){
  if(select){
    select.value=select.value||"KMCO";
    loadWeather(select.value);
    setInterval(()=>loadWeather(select.value),10*60*1000);
  }
})();

function exportForecast(){
  if(!window.jspdf||!Array.isArray(lastForecast)) return;
  const { jsPDF }=window.jspdf; const doc=new jsPDF();
  doc.setFontSize(14); doc.text(`Airport Weather Forecast`,10,10);
  lastForecast.forEach((d,i)=>{ doc.text(`${d.date} — High: ${convertTemp(d.high)}${unitLabel('temp')}, Low: ${convertTemp(d.low)}${unitLabel('temp')}, Precip: ${d.precip}mm, Wind: ${convertWind(d.wind)} ${unitLabel('wind')}`,10,20+i*10); });
  doc.save("weather-forecast.pdf");
}
window.exportForecast=exportForecast;
