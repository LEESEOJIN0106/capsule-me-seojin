import { reverseGeocode } from "@/lib/place";
import {
  formatWeatherSummary,
  latLngToGrid,
  precipLabel,
  skyLabel,
  type CapsuleWeather,
} from "@/lib/weather";

const KMA_BASE =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const SEOUL_HALL = { lat: 37.5665, lng: 126.978 };

type KmaItem = {
  category?: string;
  obsrValue?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
  baseDate?: string;
  baseTime?: string;
};

type KmaResponse = {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: KmaItem | KmaItem[] } };
  };
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function kstParts(offsetMs = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(Date.now() + offsetMs));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function ymd(parts: ReturnType<typeof kstParts>) {
  return `${parts.year}${pad2(parts.month)}${pad2(parts.day)}`;
}

/** 초단기실황: 매시 정시 발표, 10분 이후 호출 */
function ncstBase() {
  const now = kstParts();
  const parts = now.minute < 10 ? kstParts(-60 * 60 * 1000) : now;
  return {
    baseDate: ymd(parts),
    baseTime: `${pad2(parts.hour)}00`,
  };
}

/** 초단기예보: 매시 30분 발표, 45분 이후 호출 */
function fcstBase() {
  const now = kstParts();
  const parts = now.minute < 45 ? kstParts(-60 * 60 * 1000) : now;
  return {
    baseDate: ymd(parts),
    baseTime: `${pad2(parts.hour)}30`,
  };
}

function asItems(item: KmaItem | KmaItem[] | undefined): KmaItem[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function parseNumber(value: string | undefined) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function kmaGet(
  path: "getUltraSrtNcst" | "getUltraSrtFcst",
  params: Record<string, string>,
) {
  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("KMA_SERVICE_KEY is not set");
  }

  const search = new URLSearchParams({
    serviceKey,
    pageNo: "1",
    numOfRows: "100",
    dataType: "JSON",
    ...params,
  });

  const response = await fetch(`${KMA_BASE}/${path}?${search.toString()}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`KMA ${path} HTTP ${response.status}`);
  }

  const json = (await response.json()) as KmaResponse;
  const code = json.response?.header?.resultCode;
  if (code !== "00") {
    throw new Error(
      json.response?.header?.resultMsg ?? `KMA ${path} failed`,
    );
  }

  return asItems(json.response?.body?.items?.item);
}

export async function getBurialWeather(input?: {
  lat?: number;
  lng?: number;
}): Promise<CapsuleWeather> {
  const hasGps =
    typeof input?.lat === "number" &&
    Number.isFinite(input.lat) &&
    typeof input?.lng === "number" &&
    Number.isFinite(input.lng);
  const lat = hasGps ? input.lat! : SEOUL_HALL.lat;
  const lng = hasGps ? input.lng! : SEOUL_HALL.lng;
  const { nx, ny } = latLngToGrid(lat, lng);
  const ncst = ncstBase();
  const fcst = fcstBase();

  const [actualItems, forecastItems, placeName] = await Promise.all([
    kmaGet("getUltraSrtNcst", {
      base_date: ncst.baseDate,
      base_time: ncst.baseTime,
      nx: String(nx),
      ny: String(ny),
    }),
    kmaGet("getUltraSrtFcst", {
      base_date: fcst.baseDate,
      base_time: fcst.baseTime,
      nx: String(nx),
      ny: String(ny),
    }).catch(() => [] as KmaItem[]),
    hasGps ? reverseGeocode(lat, lng) : Promise.resolve("서울"),
  ]);

  const actual = Object.fromEntries(
    actualItems.map((item) => [item.category ?? "", item.obsrValue ?? ""]),
  );

  const skyItem = forecastItems.find((item) => item.category === "SKY");
  const lightningValue = parseNumber(
    forecastItems.find((item) => item.category === "LGT")?.fcstValue,
  );

  const temperature = parseNumber(actual.T1H);
  const humidity = parseNumber(actual.REH);
  const windSpeed = parseNumber(actual.WSD);
  const windDir = parseNumber(actual.VEC);
  const pty = actual.PTY ?? "0";
  const sky = skyItem?.fcstValue ?? "";

  return {
    summary: formatWeatherSummary({
      sky,
      pty,
      temperature,
    }),
    skyLabel: skyLabel(sky),
    precipLabel: precipLabel(pty),
    temperature,
    humidity,
    rainfall: actual.RN1 || "0",
    windSpeed,
    windDir,
    lightning: lightningValue != null && lightningValue > 0,
    nx,
    ny,
    baseDate: ncst.baseDate,
    baseTime: ncst.baseTime,
    locationSource: hasGps ? "gps" : "fallback",
    placeName: placeName || (hasGps ? "현재 위치" : "서울"),
    lat,
    lng,
  };
}
