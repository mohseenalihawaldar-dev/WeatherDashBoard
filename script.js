const apiKey = "9da522f9ac3a0a2b291ca43e482549bd"; // replace with your OpenWeatherMap API key
const cityInput = document.getElementById("cityInput");
const currentWeather = document.getElementById("currentWeather");
const forecast = document.getElementById("forecast");
const favorites = document.getElementById("favorites");
const weatherTip = document.getElementById("weatherTip");
let isCelsius = true;
let chart;

document.getElementById("searchBtn").onclick = () => {
  if (cityInput.value) fetchWeather(cityInput.value);
};
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && cityInput.value) fetchWeather(cityInput.value);
});
document.getElementById("unitToggle").onclick = () => {
  isCelsius = !isCelsius;
  if (cityInput.value) fetchWeather(cityInput.value);
};
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark");
  if (cityInput.value) fetchWeather(cityInput.value);
};

// Favorites
document.getElementById("saveCity").onclick = () => {
  if (cityInput.value) {
    let saved = JSON.parse(localStorage.getItem("favorites")) || [];
    if (!saved.includes(cityInput.value)) {
      saved.push(cityInput.value);
      localStorage.setItem("favorites", JSON.stringify(saved));
      renderFavorites();
    }
  }
};
function renderFavorites() {
  favorites.innerHTML = "";
  let saved = JSON.parse(localStorage.getItem("favorites")) || [];
  saved.forEach((c) => {
    const btn = document.createElement("button");
    btn.textContent = c;
    btn.onclick = () => fetchWeather(c);
    favorites.appendChild(btn);
  });
}

// Fetch weather
async function fetchWeather(city) {
  try {
    const unit = isCelsius ? "metric" : "imperial";
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`
    );
    const data = await res.json();
    if (data.cod !== 200) {
      alert("City not found");
      return;
    }
    displayCurrent(data);
    fetchForecast(city, unit);
  } catch (err) {
    console.error(err);
  }
}

function displayCurrent(data) {
  currentWeather.innerHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <img src="https://openweathermap.org/img/wn/${
      data.weather[0].icon
    }@2x.png" alt="">
    <p>${data.weather[0].description}</p>
    <p><strong>${Math.round(data.main.temp)}°${
    isCelsius ? "C" : "F"
  }</strong></p>
  `;
  showTip(data.weather[0].main);
}

async function fetchForecast(city, unit) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`
  );
  const data = await res.json();
  displayForecast(data.list);
  displayHourlyChart(data.list.slice(0, 8));
}

function displayForecast(list) {
  forecast.innerHTML = "";
  const daily = {};
  list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!daily[date]) daily[date] = item;
  });
  Object.values(daily)
    .slice(0, 5)
    .forEach((day) => {
      const card = document.createElement("div");
      card.className = "forecast-card";
      card.innerHTML = `
      <h4>${new Date(day.dt_txt).toLocaleDateString(undefined, {
        weekday: "short",
      })}</h4>
      <img src="https://openweathermap.org/img/wn/${
        day.weather[0].icon
      }@2x.png" alt="">
      <p>${Math.round(day.main.temp)}°${isCelsius ? "C" : "F"}</p>
    `;
      card.onclick = () => {
        document.getElementById("modalDetails").innerHTML = `
        <h2>${new Date(day.dt_txt).toDateString()}</h2>
        <p>Condition: ${day.weather[0].description}</p>
        <p>Temp: ${Math.round(day.main.temp)}°${isCelsius ? "C" : "F"}</p>
        <p>Humidity: ${day.main.humidity}%</p>
        <p>Wind: ${day.wind.speed} ${isCelsius ? "m/s" : "mph"}</p>
      `;
        document.getElementById("weatherModal").style.display = "flex";
      };
      forecast.appendChild(card);
    });
}

function displayHourlyChart(list) {
  const ctx = document.getElementById("hourlyChart").getContext("2d");
  const labels = list.map((item) => new Date(item.dt_txt).getHours() + ":00");
  const temps = list.map((item) => item.main.temp);
  const humidity = list.map((item) => item.main.humidity);
  const rain = list.map((item) => (item.pop ? item.pop * 100 : 0));

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Temp (°${isCelsius ? "C" : "F"})`,
          data: temps,
          yAxisID: "y",
          fill: true,
          borderColor: "#1976d2",
          backgroundColor: "rgba(25,118,210,0.35)",
          borderWidth: 4,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#1976d2",
          pointBorderWidth: 3,
          pointRadius: 5,
        },
        {
          label: "Humidity (%)",
          data: humidity,
          yAxisID: "y1",
          fill: false,
          borderColor: "#2e7d32",
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#2e7d32",
          pointBorderWidth: 3,
          pointRadius: 5,
        },
        {
          label: "Rain Chance (%)",
          data: rain,
          yAxisID: "y1",
          fill: false,
          borderColor: "#e65100",
          borderDash: [6, 6],
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#e65100",
          pointBorderWidth: 3,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // ✅ important for responsiveness
      plugins: {
        legend: {
          labels: {
            color: document.body.classList.contains("dark") ? "#fff" : "#111",
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time (hours)",
            color: document.body.classList.contains("dark") ? "#fff" : "#111",
          },
          ticks: {
            color: document.body.classList.contains("dark") ? "#fff" : "#111",
          },
        },
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: `Temp (°${isCelsius ? "C" : "F"})`,
            color: document.body.classList.contains("dark") ? "#fff" : "#111",
          },
          ticks: {
            color: document.body.classList.contains("dark") ? "#fff" : "#111",
          },
        },
        y1: {
          type: "linear",
          position: "right",
          title: {
            display: true,
            text: "Humidity / Rain (%)",
            color: document.body.classList.contains("dark") ? "#fff" : "#111",
          },
          ticks: {
            color: document.body.classList.contains("dark") ? "#fff" : "#111",
          },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

function showTip(condition) {
  let tip = "";
  switch (condition.toLowerCase()) {
    case "rain":
      tip = "☔ Don’t forget your umbrella!";
      break;
    case "clear":
      tip = "😎 Perfect day for outdoors.";
      break;
    case "clouds":
      tip = "☁ Might be gloomy, stay cozy.";
      break;
    case "snow":
      tip = "❄ Stay warm, it’s snowy out there.";
      break;
    default:
      tip = "🌍 Have a great day!";
  }
  weatherTip.textContent = tip;
}

// Modal close
document.querySelector(".close").onclick = () => {
  document.getElementById("weatherModal").style.display = "none";
};
window.onclick = (e) => {
  if (e.target === document.getElementById("weatherModal")) {
    document.getElementById("weatherModal").style.display = "none";
  }
};

// Auto location
window.onload = () => {
  renderFavorites();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
      );
      const data = await res.json();
      fetchWeather(data.name);
    });
  }
};
