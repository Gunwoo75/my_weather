// js/ui.js 파일 내용 (일부 함수 구조 수정됨)

const RECENT_CITIES_KEY = "recentCities";


// ==========================================================
// 1. 배경 업데이트 함수 (외부로 노출하지 않음)
// ==========================================================

function updateBackground(weatherId) {
    const body = document.body;
    body.classList.remove("bg-clear", "bg-clouds", "bg-rain", "bg-snow", "bg-thunder", "bg-mist");
    // ... (배경 업데이트 로직 유지)
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
    if (className) body.classList.add(className);
}

// ==========================================================
// 2. 옷차림 추천 함수 (export)
// ==========================================================

export function getClothingTip(celsiusTemp, rainSlots) {
    // ... (기존 로직 유지)
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
// 3. 현재 날씨 UI 업데이트 함수 (export)
// ==========================================================
// NOTE: main.js에서 DOM_ELEMENTS 객체를 받도록 수정
export function displayWeather(data, isCelsius, rainSlots, elements) {
    const { cityName, temperature, description, humidity, windSpeed, weatherIcon, weatherDetails, clothingTipParagraph } = elements;
    
    const temp = Math.round(data.main.temp);
    const celsiusTemp = isCelsius ? temp : Math.round((temp - 32) * 5 / 9);

    cityName.textContent = data.name;
    temperature.textContent = `${temp}°${isCelsius ? "C" : "F"}`;
    // ... (나머지 로직 유지)
    let desc = data.weather[0].description;
    if (desc === "연무") desc = "뿌연 공기";
    if (desc === "박무") desc = "옅은 안개";
    description.textContent = desc;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed}m/s`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    updateBackground(data.weather[0].id);
    clothingTipParagraph.innerHTML = getClothingTip(celsiusTemp, rainSlots);
    weatherDetails.classList.remove("hidden");
}

// ==========================================================
// 4. 시간별 예보 UI (export)
// ==========================================================

export function displayHourlyForecast(data, isCelsius, hourlyCardsDiv) {
    // ... (기존 로직 유지)
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

// ==========================================================
// 5. 단기 예보 UI (export)
// ==========================================================

export function displayForecast(data, isCelsius, forecastCardsDiv) {
    // ... (기존 로직 유지)
    forecastCardsDiv.innerHTML = "";
    const daily = data.list.filter((x) => x.dt_txt.includes("12:00:00")).slice(0, 5);

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
// 6. 최근 도시 UI (export)
// ==========================================================

// NOTE: getWeatherCallback을 fetchWeatherAndDisplay로 사용
export function loadRecentCities(cityInput, recentCitiesSection, recentListDiv, getWeatherCallback) {
    // ... (기존 로직 유지)
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
            getWeatherCallback(city);
            cityInput.value = city;
        };
        recentListDiv.appendChild(btn);
    });
}

// ==========================================================
// 7. 포켓몬고 부스트 UI (export)
// ==========================================================

function getPokeBoost(weatherId, windSpeed = 0) {
    // ... (기존 로직 유지)
    if (windSpeed >= 10) {
        return "🌬 강풍 — 비행 / 드래곤 / 에스퍼 타입 부스트";
    }
    if (weatherId >= 300 && weatherId < 600) {
        return "🌧 비 — 물 / 벌레 / 전기 타입 부스트";
    }
    if (weatherId >= 600 && weatherId < 700) {
        return "❄ 눈 — 얼음 / 강철 타입 부스트";
    }
    if (weatherId === 741 || (weatherId >= 700 && weatherId < 800)) {
        return "🌫 안개 — 고스트 / 악 타입 부스트";
    }
    if (weatherId === 800) {
        return "☀️ 맑음 — 땅 / 풀 / 불꽃 타입 부스트";
    }
    if (weatherId === 801) {
        return "🌤 약간구름 — 바위 / 노멀 타입 부스트";
    }
    if (weatherId === 802 || weatherId === 803 || weatherId === 804) {
        return "☁ 구름 — 격투 / 독 / 페어리 타입 부스트";
    }
    return "부스트 정보를 확인할 수 없습니다.";
}

export function displayPokeBoost(data, pogoboostContent) {
    const weatherId = data.weather[0].id;
    const windSpeed = data.wind.speed; // 풍속 데이터를 사용하도록 수정
    pogoboostContent.textContent = getPokeBoost(weatherId, windSpeed);
}