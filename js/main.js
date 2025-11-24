// ==========================================================
// 1. 기본 설정 및 DOM 요소 캐싱
// ==========================================================

const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY_PLACEHOLDER";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const MAX_RECENT_CITIES = 5;
const RECENT_CITIES_KEY = "recentCities";

const cityInput = document.querySelector("#city-input");
const searchBtn = document.querySelector("#search-btn");
const unitToggleBtn = document.querySelector("#unit-toggle-btn");
const recentListDiv = document.querySelector("#recent-list");
const recentCitiesSection = document.querySelector("#recent-cities");
const errorDisplay = document.querySelector("#error-message");
const weatherDetails = document.querySelector("#weather-details");
const forecastCardsDiv = document.querySelector("#forecast-cards");
const hourlyCardsDiv = document.querySelector("#hourly-cards");
const clothingTipParagraph = document.querySelector("#clothing-tip");
const pogoboostContent = document.querySelector("#pogoboost-content"); // 포켓몬고 섹션 캐싱

let isCelsius = true;
let currentWeatherCache = null;


// ==========================================================
// 2. API 호출
// ==========================================================

async function getWeather(city) {
    const unit = isCelsius ? "metric" : "imperial";
    const url = `${BASE_URL}/weather?q=${encodeURIComponent(
        city
    )}&appid=${API_KEY}&units=${unit}&lang=kr`;

    try {
        errorDisplay.classList.add("hidden");
        weatherDetails.classList.add("hidden");

        const res = await fetch(url);
        if (!res.ok) throw new Error("도시를 찾을 수 없습니다.");

        const data = await res.json();
        currentWeatherCache = data;

        const willRainInfo = await getTodayRainInfo(
            data.coord.lat,
            data.coord.lon
        );

        displayWeather(data, willRainInfo);
        updateRecentCities(city);
        await getForecast(data.coord.lat, data.coord.lon);
    } catch (err) {
        handleError(err);
    }
}

async function getForecast(lat, lon) {
    const unit = isCelsius ? "metric" : "imperial";
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}&lang=kr`;

    const res = await fetch(url);
    if (!res.ok) return;

    const data = await res.json();

    displayHourlyForecast(data);
    displayForecast(data);
}

async function getTodayRainInfo(lat, lon) {
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();

    const today = new Date().getDate();

    const todayList = data.list.filter((item) => {
        const d = new Date(item.dt * 1000);
        return d.getDate() === today;
    });

    const rainSlots = todayList.filter((item) => {
        const id = item.weather[0].id;
        const pop = item.pop;
        return (id >= 500 && id < 600) || pop >= 0.3;
    });

    return rainSlots;
}


// ==========================================================
// 3. 배경 및 부스트 업데이트 (누락 기능 포함)
// ==========================================================

function updateBackground(weatherId) {
    const body = document.body;
    body.classList.remove("bg-clear", "bg-clouds", "bg-rain", "bg-snow", "bg-thunder", "bg-mist");

    let className = "";

    if (weatherId >= 200 && weatherId < 300) {
        className = "bg-thunder";
    } else if (weatherId >= 300 && weatherId < 600) { 
        className = "bg-rain";
    } else if (weatherId >= 600 && weatherId < 700) {
        className = "bg-snow";
    } else if (weatherId >= 700 && weatherId < 800) {
        className = "bg-mist";
    } else if (weatherId === 800) {
        className = "bg-clear";
    } else if (weatherId > 800) {
        className = "bg-clouds";
    }

    if (className) {
        body.classList.add(className);
    }
}

function getPokeBoost(weatherId) {
    if (weatherId >= 200 && weatherId < 300) {
        return "⚡️ 비/바람: 전기, 물, 벌레 타입 부스트";
    } else if (weatherId >= 300 && weatherId < 600) {
        return "🌧 비: 물, 전기, 벌레 타입 부스트";
    } else if (weatherId >= 600 && weatherId < 700) {
        return "❄️ 눈: 얼음, 강철 타입 부스트";
    } else if (weatherId >= 700 && weatherId < 800) {
        return "🌫 안개: 악, 고스트 타입 부스트";
    } else if (weatherId === 800) {
        return "☀️ 맑음: 풀, 땅, 불 타입 부스트";
    } else if (weatherId === 804) {
        return "☁️ 구름 많음: 페어리, 격투 타입 부스트";
    } else if (weatherId > 800) {
        return "☁️ 흐림: 페어리, 격투 타입 부스트";
    }
    return "날씨 정보가 명확하지 않아 부스트를 확인할 수 없습니다.";
}

function displayPokeBoost(data) {
    const weatherId = data.weather[0].id;
    pogoboostContent.textContent = getPokeBoost(weatherId);
}


// ==========================================================
// 4. 옷차림 추천
// ==========================================================

function getClothingTip(celsiusTemp, rainSlots) {
    let coat = "";
    let inner = "";

    if (celsiusTemp >= 28) inner = "민소매, 반팔 티셔츠";
    else if (celsiusTemp >= 23) inner = "반팔, 얇은 셔츠";
    else if (celsiusTemp >= 20) { coat = "얇은 가디건"; inner = "긴팔 티셔츠"; }
    else if (celsiusTemp >= 17) { coat = "얇은 재킷"; inner = "맨투맨"; }
    else if (celsiusTemp >= 12) { coat = "가디건, 야상"; inner = "기모 후드티"; }
    else if (celsiusTemp >= 9)  { coat = "트렌치 코트"; inner = "두꺼운 상의"; }
    else if (celsiusTemp >= 5)  { coat = "울 코트"; inner = "히트텍"; }
    else                        { coat = "패딩"; inner = "방한용품 필수"; }

    let html = "";
    if (coat) html += `아우터: ${coat}<br>`;
    if (inner) html += `상의: ${inner}<br>`;

    if (rainSlots.length > 0) {
        html += "<br>☔ <b>오늘 비가 오는 시간</b><br>";

        rainSlots.forEach((slot) => {
            const t = new Date(slot.dt * 1000);
            const h = t.getHours();
            html += `• ${h}시 비 예보<br>`;
        });

        html += "우산을 챙기세요!";
    }

    return html;
}


// ==========================================================
// 5. UI 업데이트
// ==========================================================

function displayWeather(data, rainSlots) {
    const temp = Math.round(data.main.temp);
    const celsiusTemp = isCelsius ? temp : Math.round((temp - 32) * 5 / 9);

    document.querySelector("#city-name").textContent = data.name;
    document.querySelector("#temperature").textContent =
        `${temp}°${isCelsius ? "C" : "F"}`;
    document.querySelector("#description").textContent =
        data.weather[0].description;

    document.querySelector("#humidity").textContent =
        `${data.main.humidity}%`;
    document.querySelector("#wind-speed").textContent =
        `${data.wind.speed}m/s`;

    document.querySelector("#weather-icon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    // 배경 및 부스트 업데이트
    updateBackground(data.weather[0].id);
    displayPokeBoost(data);
    
    // 옷차림 추천
    clothingTipParagraph.innerHTML = getClothingTip(
        celsiusTemp,
        rainSlots
    );

    weatherDetails.classList.remove("hidden");
}

function handleError(err) {
    errorDisplay.textContent = err.message || "날씨 정보를 불러오는 데 실패했습니다.";
    errorDisplay.classList.remove("hidden");
    weatherDetails.classList.add("hidden"); 
}


// ==========================================================
// 6. 시간별 / 단기 예보
// ==========================================================

function displayHourlyForecast(data) {
    hourlyCardsDiv.innerHTML = "";

    const list = data.list.slice(0, 8);

    list.forEach((f) => {
        const d = new Date(f.dt * 1000);
        const hour = d.getHours();
        const temp = Math.round(f.main.temp);

        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
            <h4>${hour}시</h4>
            <img src="https://openweathermap.org/img/wn/${f.weather[0].icon}.png">
            <p>${temp}°${isCelsius ? "C" : "F"}</p>
        `;
        hourlyCardsDiv.appendChild(card);
    });
}

function displayForecast(data) {
    forecastCardsDiv.innerHTML = "";

    const daily = data.list.filter((x) =>
        x.dt_txt.includes("12:00:00")
    ).slice(0, 5);

    daily.forEach((f) => {
        const d = new Date(f.dt * 1000);
        const day = d.toLocaleDateString("ko-KR", { weekday: "short" });
        const temp = Math.round(f.main.temp);

        const card = document.createElement("div");
        card.className = "forecast-card";
        card.innerHTML = `
            <h4>${day}</h4>
            <img src="https://openweathermap.org/img/wn/${f.weather[0].icon}.png">
            <p>${temp}°${isCelsius ? "C" : "F"}</p>
        `;
        forecastCardsDiv.appendChild(card);
    });
}


// ==========================================================
// 7. 최근 검색
// ==========================================================

function updateRecentCities(city) {
    let list = JSON.parse(localStorage.getItem(RECENT_CITIES_KEY)) || [];
    city = city.trim();

    list = list.filter((c) => c.toLowerCase() !== city.toLowerCase());
    list.unshift(city);

    if (list.length > MAX_RECENT_CITIES) list = list.slice(0, MAX_RECENT_CITIES);

    localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(list));
    loadRecentCities();
}

function loadRecentCities() {
    recentListDiv.innerHTML = "";

    const list = JSON.parse(localStorage.getItem(RECENT_CITIES_KEY)) || [];

    if (list.length === 0) {
        recentCitiesSection.classList.add("hidden");
        return;
    }

    recentCitiesSection.classList.remove("hidden");

    list.forEach((city) => {
        const btn = document.createElement("button");
        btn.textContent = city;
        btn.className = "recent-city-btn";
        btn.onclick = () => {
            getWeather(city);
            cityInput.value = city;
        };
        recentListDiv.appendChild(btn);
    });
}


// ==========================================================
// 8. 이벤트
// ==========================================================

searchBtn.onclick = () => {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
};

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

unitToggleBtn.onclick = () => {
    isCelsius = !isCelsius;
    if (currentWeatherCache)
        getWeather(currentWeatherCache.name);
};


// ==========================================================
// 9. 위치 기반 자동 로딩
// ==========================================================

window.onload = () => {
    loadRecentCities();

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;

            // 로컬 환경에서도 동작하도록 단일 파일에 로직 포함
            const url = `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`;
            const res = await fetch(url);
            const data = await res.json();

            cityInput.value = data.name;
            getWeather(data.name);
        },
        () => getWeather("Seoul")
    );
};