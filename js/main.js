// js/main.js 파일 내용

// ==========================================================
// 1. 모듈 Import 및 DOM 요소 캐싱
// ==========================================================

import { getWeather, getForecast, getTodayRainInfo } from './api.js';
import { displayWeather, displayHourlyForecast, displayForecast, loadRecentCities, displayPokeBoost } from './ui.js';

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
const pogoboostContent = document.querySelector("#pogoboost-content"); 

let isCelsius = true;
let currentWeatherCache = null;

// UI 모듈에서 필요한 DOM 요소들을 한 번에 묶어 전달하기 위한 객체
const DOM_ELEMENTS = {
    cityName: document.querySelector("#city-name"),
    temperature: document.querySelector("#temperature"),
    description: document.querySelector("#description"),
    humidity: document.querySelector("#humidity"),
    windSpeed: document.querySelector("#wind-speed"),
    weatherIcon: document.querySelector("#weather-icon"),
    weatherDetails: weatherDetails,
    clothingTipParagraph: clothingTipParagraph,
    pogoboostContent: pogoboostContent
};


// ==========================================================
// 2. 메인 로직 (API 호출 및 UI 업데이트 흐름 제어)
// ==========================================================

async function fetchWeatherAndDisplay(query) {
    // 쿼리가 좌표 형식인지 (lat=...&lon=...) 확인합니다.
    const isCoordinate = query.startsWith('lat=') && query.includes('lon=');
    const city = isCoordinate ? query : query.trim();
    
    if (!city) return;

    try {
        errorDisplay.classList.add("hidden");
        weatherDetails.classList.add("hidden");

        // API 모듈에서 데이터 가져오기 (API 키는 api.js에서 처리)
        // 쿼리가 좌표일 경우 city 파라미터 대신 좌표 쿼리를 직접 전달
        const data = await getWeather(city, isCelsius);
        currentWeatherCache = data;
        
        const { lat, lon } = data.coord;

        const willRainInfo = await getTodayRainInfo(lat, lon);

        // UI 모듈 함수 호출
        displayWeather(data, isCelsius, willRainInfo, DOM_ELEMENTS);
        displayPokeBoost(data, DOM_ELEMENTS.pogoboostContent);
        
        await displayForecast(data, isCelsius, forecastCardsDiv);
        await displayHourlyForecast(data, isCelsius, hourlyCardsDiv);

        updateRecentCities(data.name);

    } catch (err) {
        handleError(err);
    }
}

function updateRecentCities(city) {
    let list = JSON.parse(localStorage.getItem(RECENT_CITIES_KEY)) || [];
    list = list.filter((c) => c.toLowerCase() !== city.toLowerCase());
    list.unshift(city);

    if (list.length > MAX_RECENT_CITIES) list = list.slice(0, MAX_RECENT_CITIES);

    localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(list));
    loadRecentCities(cityInput, recentCitiesSection, recentListDiv, fetchWeatherAndDisplay); // 콜백 함수 사용
}

function handleError(err) {
    errorDisplay.textContent = err.message || "날씨 정보를 불러오는 데 실패했습니다.";
    errorDisplay.classList.remove("hidden");
    weatherDetails.classList.add("hidden"); 
}


// ==========================================================
// 3. 이벤트 핸들러
// ==========================================================

searchBtn.onclick = () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherAndDisplay(city); // 새 함수 호출
};

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

unitToggleBtn.onclick = () => {
    isCelsius = !isCelsius;
    if (currentWeatherCache)
        fetchWeatherAndDisplay(currentWeatherCache.name); // 새 함수 호출
};


// ==========================================================
// 4. 위치 기반 자동 로딩
// ==========================================================

window.onload = () => {
    // loadRecentCities에 콜백 함수 전달
    loadRecentCities(cityInput, recentCitiesSection, recentListDiv, fetchWeatherAndDisplay); 

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // 좌표를 쿼리 문자열로 만들어 전달
            fetchWeatherAndDisplay(`lat=${latitude}&lon=${longitude}`);
        },
        // 실패 시
        () => fetchWeatherAndDisplay("Seoul")
    );
};