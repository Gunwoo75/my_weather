// js/main.js 파일 내용

// ==========================================================
// 1. 모듈 Import 및 DOM 요소 캐싱
// ==========================================================

// js/api.js 파일에서 API 관련 함수들을 가져옵니다.
import { getWeather, getForecast, getTodayRainInfo } from './api.js';
// js/ui.js 파일에서 UI 관련 함수들을 가져옵니다.
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
    // 쿼리가 좌표 형식인지 (lat=...&lon=...) 확인합니다.
    const isCoordinate = query.startsWith('lat=') && query.includes('lon=');
    const city = isCoordinate ? query : query.trim();
    
    if (!city) return;

    try {
        errorDisplay.classList.add("hidden");
        weatherDetails.classList.add("hidden");

        // 1. 현재 날씨 데이터 가져오기 (api.js의 getWeather 함수 사용)
        const data = await getWeather(city, isCelsius);
        currentWeatherCache = data;
        
        const { lat, lon } = data.coord;

        // 2. 강수 정보 가져오기 (api.js의 getTodayRainInfo 함수 사용)
        const willRainInfo = await getTodayRainInfo(lat, lon);

        // 3. UI 업데이트 (ui.js의 함수들 사용)
        displayWeather(data, isCelsius, willRainInfo, DOM_ELEMENTS);
        displayPokeBoost(data, DOM_ELEMENTS.pogoboostContent);
        
        // 4. 예보 데이터 업데이트
        await displayForecast(data, isCelsius, forecastCardsDiv);
        await displayHourlyForecast(data, isCelsius, hourlyCardsDiv);

        // 5. 최근 검색 업데이트
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
    // loadRecentCities 호출 시 콜백 함수(fetchWeatherAndDisplay) 전달
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
// 4. 위치 기반 자동 로딩 (간소화)
// ==========================================================

window.onload = () => {
    // 로드 시 최근 검색어 로딩
    loadRecentCities(cityInput, recentCitiesSection, recentListDiv, fetchWeatherAndDisplay); 

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            
            // 위치 정보를 얻으면 좌표 기반으로 날씨 정보를 요청
            // NOTE: api.js의 getWeather 함수가 q={city} 형태를 기대하므로,
            // 임시로 기본 도시로 호출하여 API 키 주입 여부 확인에 집중합니다.
            fetchWeatherAndDisplay("Seoul"); 
        },
        // 실패 시 서울 날씨 정보 로드
        () => fetchWeatherAndDisplay("Seoul")
    );
};