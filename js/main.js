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

// UI 모듈 함수에 전달하기 위한 DOM 요소 객체
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
    const isCoordinate = query.startsWith('lat=') && query.includes('lon=');
    const cityQuery = isCoordinate ? query : query.trim();
    
    if (!cityQuery) return;

    try {
        errorDisplay.classList.add("hidden");
        weatherDetails.classList.add("hidden");

        // 1. 현재 날씨 데이터 가져오기 (API 호출)
        const currentData = await getWeather(cityQuery, isCelsius);
        currentWeatherCache = currentData;
        
        const { lat, lon } = currentData.coord;

        // 2. 강수 정보 가져오기
        const willRainInfo = await getTodayRainInfo(lat, lon); 

        // 3. 예보 데이터 가져오기 (⭐로직 수정⭐)
        const forecastData = await getForecast(lat, lon, isCelsius);

        // 4. UI 업데이트 (ui.js의 함수들 사용)
        displayWeather(currentData, isCelsius, willRainInfo, DOM_ELEMENTS);
        displayPokeBoost(currentData, DOM_ELEMENTS.pogoboostContent);
        
        // 5. 예보 데이터 화면에 표시 (forecastData 전달)
        displayForecast(forecastData, isCelsius, forecastCardsDiv);
        displayHourlyForecast(forecastData, isCelsius, hourlyCardsDiv);

        // 6. 최근 검색 업데이트
        updateRecentCities(currentData.name);

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
    loadRecentCities(cityInput, recentCitiesSection, recentListDiv, fetchWeatherAndDisplay);
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
    if (city) fetchWeatherAndDisplay(city);
};

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

unitToggleBtn.onclick = () => {
    isCelsius = !isCelsius;
    if (currentWeatherCache)
        fetchWeatherAndDisplay(currentWeatherCache.name);
};


// ==========================================================
// 4. 위치 기반 자동 로딩
// ==========================================================

window.onload = () => {
    loadRecentCities(cityInput, recentCitiesSection, recentListDiv, fetchWeatherAndDisplay); 

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // 위치 정보를 얻으면 좌표 기반 쿼리를 만들어 전달
            fetchWeatherAndDisplay(`lat=${latitude}&lon=${longitude}`);
        },
        // 실패 시 서울 날씨 정보 로드
        () => fetchWeatherAndDisplay("Seoul")
    );
};