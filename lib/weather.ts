export type CapsuleWeather = {
  summary: string;
  skyLabel: string;
  precipLabel: string;
  temperature: number | null;
  humidity: number | null;
  rainfall: string;
  windSpeed: number | null;
  windDir?: number | null;
  lightning?: boolean;
  nx: number;
  ny: number;
  baseDate: string;
  baseTime: string;
  locationSource: "gps" | "fallback";
  placeName?: string;
  lat?: number | null;
  lng?: number | null;
};

export type WeatherPeriod = "dawn" | "day" | "dusk" | "night";
export type WeatherMood =
  | "sun"
  | "cloud"
  | "rain"
  | "storm"
  | "snow"
  | "mist"
  | "wind";
export type WeatherInk = "light" | "dark";

const WIND_DIRS = [
  "북풍",
  "북동풍",
  "동풍",
  "남동풍",
  "남풍",
  "남서풍",
  "서풍",
  "북서풍",
] as const;

const PERIOD_WORD: Record<WeatherPeriod, string> = {
  dawn: "새벽",
  day: "낮",
  dusk: "저녁",
  night: "밤",
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

export function parseRainfallMm(rainfall: string | undefined) {
  if (!rainfall || rainfall === "-" || rainfall.includes("없음")) return 0;
  const parsed = Number(String(rainfall).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function weatherHour(weather: Pick<CapsuleWeather, "baseTime">) {
  return Number(weather.baseTime.slice(0, 2)) || 0;
}

export function weatherPeriod(
  weather: Pick<CapsuleWeather, "baseTime">,
): WeatherPeriod {
  const hour = weatherHour(weather);
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

export function windDirLabel(deg?: number | null) {
  if (deg == null || Number.isNaN(deg)) return null;
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return WIND_DIRS[index];
}

export function windStrength(ms: number) {
  if (ms < 0.5) return "고요";
  if (ms < 3.4) return "실바람";
  if (ms < 5.5) return "남실바람";
  if (ms < 8) return "산들바람";
  if (ms < 10.8) return "건들바람";
  return "센바람";
}

export function weatherMood(weather: CapsuleWeather): WeatherMood {
  const rainMm = parseRainfallMm(weather.rainfall);
  const wind = weather.windSpeed ?? 0;
  const raining =
    weather.precipLabel.includes("비") ||
    weather.precipLabel.includes("빗") ||
    rainMm > 0;

  if (weather.precipLabel.includes("눈")) return "snow";
  if (weather.lightning || (raining && wind >= 8) || rainMm >= 8) return "storm";
  if (raining) return "rain";
  if (wind >= 8) return "wind";
  if (
    weather.skyLabel === "흐림" ||
    ((weather.humidity ?? 0) >= 85 && weather.skyLabel !== "맑음")
  ) {
    return (weather.humidity ?? 0) >= 80 ? "mist" : "cloud";
  }
  if (weather.skyLabel === "구름많음") return "cloud";
  return "sun";
}

export function weatherInk(weather: CapsuleWeather): WeatherInk {
  const mood = weatherMood(weather);
  const period = weatherPeriod(weather);
  if (mood === "storm" || mood === "rain" || period === "night") return "light";
  if (period === "dusk" && mood !== "sun") return "light";
  if (mood === "mist" && period !== "day") return "light";
  return "dark";
}

export function weatherFeel(weather: CapsuleWeather) {
  const period = PERIOD_WORD[weatherPeriod(weather)];
  const mood = weatherMood(weather);
  const rainMm = parseRainfallMm(weather.rainfall);
  const wind = weather.windSpeed ?? 0;
  const dir = windDirLabel(weather.windDir);
  const temp = weather.temperature;
  const humidity = weather.humidity ?? 0;

  if (mood === "snow") return `눈이 내려앉는 ${period}`;
  if (mood === "storm") return "하늘이 크게 흔들리고 있어요";
  if (mood === "rain") {
    if (weather.precipLabel.includes("빗방울") || (rainMm > 0 && rainMm < 1)) {
      return `가랑비가 스치는 ${period}`;
    }
    if (rainMm >= 5) return `비가 짙게 내리는 ${period}`;
    return `비가 내리는 ${period}`;
  }
  if (mood === "wind") {
    return dir ? `${dir}이 세게 불어요` : "바람이 세게 스쳐 가요";
  }
  if (mood === "mist") return `안개처럼 흐린 ${period}`;
  if (mood === "cloud") return `구름이 머무는 ${period}`;
  if (temp != null && temp >= 28 && humidity >= 60) {
    return `후텁지근한 ${period}`;
  }
  if (temp != null && temp >= 26 && humidity < 45) {
    return `볕이 뜨거운 ${period}`;
  }
  if (temp != null && temp <= 2) return `공기가 차가운 ${period}`;
  if (temp != null && temp <= 8 && wind >= 3) {
    return `찬 바람이 스치는 ${period}`;
  }
  if (humidity >= 80) return `습한 기운이 감도는 ${period}`;
  if (humidity > 0 && humidity <= 35) return `공기가 보송한 ${period}`;
  if (wind >= 4 && dir) return `맑고 ${dir}이 스치는 ${period}`;
  return `맑고 고요한 ${period}`;
}

export function weatherStats(weather: CapsuleWeather) {
  const stats: { label: string; value: string }[] = [];
  if (weather.humidity != null) {
    stats.push({
      label:
        weather.humidity >= 70
          ? "촉촉"
          : weather.humidity <= 40
            ? "건조"
            : "습도",
      value: `${weather.humidity}%`,
    });
  }
  if (weather.windSpeed != null) {
    stats.push({
      label: windDirLabel(weather.windDir) ?? "바람",
      value: windStrength(weather.windSpeed),
    });
  }
  const rainMm = parseRainfallMm(weather.rainfall);
  if (rainMm > 0 || weather.precipLabel !== "없음") {
    stats.push({
      label: weather.precipLabel.includes("눈") ? "적설" : "강수",
      value: rainMm > 0 ? `${rainMm}mm` : weather.precipLabel,
    });
  }
  return stats;
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

let currentWeatherInflight: Promise<CapsuleWeather | null> | null = null;

function coordsCacheKey(coords?: { lat: number; lng: number } | null) {
  if (!coords) return "fallback";
  return `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)}`;
}

export async function fetchCurrentWeather(force = false): Promise<CapsuleWeather | null> {
  if (!force && currentWeatherInflight) return currentWeatherInflight;

  currentWeatherInflight = (async () => {
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
  })().finally(() => {
    currentWeatherInflight = null;
  });

  return currentWeatherInflight;
}
