export const CAPSULE_SHAPES = [
  "sun",
  "cloud",
  "rain",
  "snow",
  "wind",
  "storm",
  "mist",
  "orb",
] as const;

export type CapsuleShape = (typeof CAPSULE_SHAPES)[number];

export type CapsuleStyle = {
  shape: CapsuleShape;
  primary: string;
  secondary: string;
  accent: string;
  mood: string;
  title: string;
};

export type CapsuleLook = {
  style: CapsuleStyle;
  keywords: string[];
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isCapsuleShape(value: unknown): value is CapsuleShape {
  return (
    typeof value === "string" &&
    (CAPSULE_SHAPES as readonly string[]).includes(value)
  );
}

export function sanitizeHex(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value)
    ? value.toUpperCase()
    : fallback;
}

export function sanitizeKeywords(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const keywords: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const keyword = item.trim().replace(/^#/, "").slice(0, 12);
    if (!keyword || seen.has(keyword)) continue;
    seen.add(keyword);
    keywords.push(keyword);
    if (keywords.length >= 6) break;
  }
  return keywords;
}

export function sanitizeStyle(value: unknown, fallback: CapsuleStyle): CapsuleStyle {
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Record<string, unknown>;
  return {
    shape: isCapsuleShape(raw.shape) ? raw.shape : fallback.shape,
    primary: sanitizeHex(raw.primary, fallback.primary),
    secondary: sanitizeHex(raw.secondary, fallback.secondary),
    accent: sanitizeHex(raw.accent, fallback.accent),
    mood:
      typeof raw.mood === "string" && raw.mood.trim()
        ? raw.mood.trim().slice(0, 20)
        : fallback.mood,
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title.trim().slice(0, 24)
        : fallback.title,
  };
}

export function fallbackLookFromWeather(input: {
  skyLabel?: string;
  precipLabel?: string;
  temperature?: number | null;
}): CapsuleLook {
  const precip = input.precipLabel ?? "없음";
  const sky = input.skyLabel ?? "맑음";
  const temperature = input.temperature;

  if (precip.includes("눈")) {
    return {
      style: {
        shape: "snow",
        primary: "#E8F3FF",
        secondary: "#7EB6D9",
        accent: "#F7FBFF",
        mood: "고요",
        title: "눈의 캡슐",
      },
      keywords: ["눈", "고요", "기억", "찬공기"],
    };
  }

  if (precip.includes("비") || precip.includes("빗")) {
    return {
      style: {
        shape: "rain",
        primary: "#4C6F8F",
        secondary: "#1F3347",
        accent: "#9EC9E8",
        mood: "촉촉",
        title: "빗방울 캡슐",
      },
      keywords: ["비", "촉촉", "속마음", "오늘"],
    };
  }

  if (sky === "흐림") {
    return {
      style: {
        shape: "mist",
        primary: "#8B909A",
        secondary: "#4A5060",
        accent: "#D6D8DE",
        mood: "잔잔",
        title: "안개 캡슐",
      },
      keywords: ["흐림", "잔잔", "생각", "하루"],
    };
  }

  if (sky === "구름많음") {
    return {
      style: {
        shape: "cloud",
        primary: "#A9C4DE",
        secondary: "#5E7FA3",
        accent: "#F2F6FA",
        mood: "포근",
        title: "구름 캡슐",
      },
      keywords: ["구름", "포근", "마음", "기록"],
    };
  }

  if (typeof temperature === "number" && temperature >= 28) {
    return {
      style: {
        shape: "sun",
        primary: "#F4B942",
        secondary: "#E07A2F",
        accent: "#FFF3C4",
        mood: "따스",
        title: "햇살 캡슐",
      },
      keywords: ["햇살", "더위", "활기", "오늘"],
    };
  }

  return {
    style: {
      shape: "orb",
      primary: "#E8C872",
      secondary: "#8B6914",
      accent: "#FFF6D8",
      mood: "아늑",
      title: "시간의 캡슐",
    },
    keywords: ["시간", "기억", "마음", "캡슐"],
  };
}

export async function fetchCapsuleLook(input: {
  weather: {
    summary: string;
    skyLabel: string;
    precipLabel: string;
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
  } | null;
  to: string;
  letter: string;
  reason: string;
}): Promise<CapsuleLook> {
  const response = await fetch("/api/capsule-style", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return fallbackLookFromWeather(input.weather ?? {});
  }

  const data = (await response.json()) as CapsuleLook;
  return {
    style: sanitizeStyle(
      data.style,
      fallbackLookFromWeather(input.weather ?? {}).style,
    ),
    keywords: sanitizeKeywords(data.keywords),
  };
}
