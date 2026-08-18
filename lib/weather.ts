export type CapsuleWeather = {
  summary: string;
  skyLabel: string;
  precipLabel: string;
  temperature: number | null;
  humidity: number | null;
  rainfall: string;
  windSpeed: number | null;
  nx: number;
  ny: number;
  baseDate: string;
  baseTime: string;
  locationSource: "gps" | "fallback";
  placeName: string;
  lat: number | null;
  lng: number | null;
};

const PTY_LABELS: Record<string, string> = {
  "0": "없음",
  "1": "비",
  "2": "비/눈",
  "3": "눈",
  "5": "빗방울",
  "6": "빗방울/눈날림",
  "7": "눈날림",
};

const SKY_LABELS: Record<string, string> = {
  "1": "맑음",
  "3": "구름많음",
  "4": "흐림",
};

export function precipLabel(pty: string | number | undefined) {
  return PTY_LABELS[String(pty ?? "0")] ?? "없음";
}

export function skyLabel(sky: string | number | undefined) {
  return SKY_LABELS[String(sky ?? "")] ?? "알 수 없음";
}

export function weatherEmoji(weather: Pick<CapsuleWeather, "precipLabel" | "skyLabel">) {
  if (weather.precipLabel.includes("눈")) return "❄️";
  if (weather.precipLabel.includes("비") || weather.precipLabel.includes("빗")) return "🌧️";
  if (weather.skyLabel === "맑음") return "☀️";
  if (weather.skyLabel === "구름많음") return "⛅";
  if (weather.skyLabel === "흐림") return "☁️";
  return "🌡️";
}

export function weatherPlaceLabel(
  weather: Pick<CapsuleWeather, "placeName" | "locationSource">,
) {
  if (weather.placeName) return weather.placeName;
  return weather.locationSource === "gps" ? "현재 위치" : "서울";
}

export function weatherShortPlace(
  weather: Pick<CapsuleWeather, "placeName" | "locationSource">,
) {
  const label = weatherPlaceLabel(weather);
  const parts = label.split(/\s+/);
  return parts[parts.length - 1] || label;
}

export function weatherObservedAt(weather: Pick<CapsuleWeather, "baseDate" | "baseTime">) {
  const month = Number(weather.baseDate.slice(4, 6));
  const day = Number(weather.baseDate.slice(6, 8));
  const hour = weather.baseTime.slice(0, 2);
  const minute = weather.baseTime.slice(2, 4);
  if (!month || !day || !hour) return "";
  return `${month}월 ${day}일 ${hour}:${minute || "00"}`;
}

export function weatherCondition(weather: Pick<CapsuleWeather, "precipLabel" | "skyLabel">) {
  return weather.precipLabel !== "없음" ? weather.precipLabel : weather.skyLabel;
}

export function formatWeatherSummary(input: {
  sky?: string | number;
  pty?: string | number;
  temperature?: number | null;
}) {
  const precip = precipLabel(input.pty);
  const sky = skyLabel(input.sky);
  const condition = precip === "없음" ? sky : precip;
  if (input.temperature == null || Number.isNaN(input.temperature)) {
    return condition;
  }
  return `${condition} ${input.temperature}℃`;
}

/** 기상청 단기예보용 위경도 → 격자(nx, ny) 변환 */
export function latLngToGrid(lat: number, lng: number) {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

export async function getBrowserLocation(): Promise<{
  lat: number;
  lng: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

export async function fetchBurialWeather(coords?: {
  lat: number;
  lng: number;
} | null): Promise<CapsuleWeather | null> {
  const params = new URLSearchParams();
  if (coords) {
    params.set("lat", String(coords.lat));
    params.set("lng", String(coords.lng));
  }

  const response = await fetch(`/api/weather?${params.toString()}`);
  if (!response.ok) return null;

  const data = (await response.json()) as { weather?: CapsuleWeather };
  return data.weather ?? null;
}

const CURRENT_WEATHER_TTL_MS = 8 * 60 * 1000;

let currentWeatherCache: {
  key: string;
  at: number;
  weather: CapsuleWeather;
} | null = null;

function coordsCacheKey(coords?: { lat: number; lng: number } | null) {
  if (!coords) return "fallback";
  return `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;
}

export async function fetchCurrentWeather(force = false): Promise<CapsuleWeather | null> {
  const coords = await getBrowserLocation();
  const key = coordsCacheKey(coords);
  const now = Date.now();

  if (
    !force &&
    currentWeatherCache &&
    currentWeatherCache.key === key &&
    now - currentWeatherCache.at < CURRENT_WEATHER_TTL_MS
  ) {
    return currentWeatherCache.weather;
  }

  const weather = await fetchBurialWeather(coords);
  if (weather) {
    currentWeatherCache = { key, at: now, weather };
  }
  return weather;
}
