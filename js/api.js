// js/api.js 파일 내용

// ==========================================================
// 1. 기본 설정 (Netlify 환경 변수 주입 대상)
// ==========================================================
// NOTE: Netlify 빌드 시 이 더미 문자열이 실제 API 키로 대체됩니다.
const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY_PLACEHOLDER";
const BASE_URL = "https://api.openweathermap.org/data/2.5";


/**
 * 현재 날씨 정보를 가져옵니다.
 */
export async function getWeather(city, isCelsius) {
    const unit = isCelsius ? "metric" : "imperial";
    const url = `${BASE_URL}/weather?q=${encodeURIComponent(
        city
    )}&appid=${API_KEY}&units=${unit}&lang=kr`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("도시를 찾을 수 없습니다.");

    return await res.json();
}

/**
 * 시간별/단기 예보를 가져옵니다.
 */
export async function getForecast(lat, lon, isCelsius) {
    const unit = isCelsius ? "metric" : "imperial";
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}&lang=kr`;

    const res = await fetch(url);
    if (!res.ok) return null;

    return await res.json();
}

/**
 * 오늘 날짜 00~23시 강수 예보만 찾습니다.
 */
export async function getTodayRainInfo(lat, lon) {
    // Note: 옷차림 추천을 위해 강수 정보는 항상 metric(섭씨) 기준으로 가져옵니다.
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();

    const today = new Date().getDate();

    // 오늘 날짜 예보만 필터링
    const todayList = data.list.filter((item) => {
        const d = new Date(item.dt * 1000);
        return d.getDate() === today; // 오늘날짜만
    });

    // 비 오는 시간대만 추출 (비 종류 ID 500대, 또는 강수 확률(pop) 30% 이상)
    const rainSlots = todayList.filter((item) => {
        const id = item.weather[0].id;
        const pop = item.pop;
        return (id >= 500 && id < 600) || pop >= 0.3;
    });

    return rainSlots;
}