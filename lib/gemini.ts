import { GoogleGenAI, Type } from "@google/genai";
import {
  CAPSULE_SHAPES,
  fallbackLookFromWeather,
  sanitizeKeywords,
  sanitizeStyle,
  type CapsuleLook,
} from "@/lib/capsule-style";
import type { CapsuleWeather } from "@/lib/weather";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-2.5-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

const lookSchema = {
  type: Type.OBJECT,
  required: ["shape", "primary", "secondary", "accent", "mood", "title", "keywords"],
  properties: {
    shape: {
      type: Type.STRING,
      enum: [...CAPSULE_SHAPES],
      description: "날씨에 맞는 캡슐 형태",
    },
    primary: { type: Type.STRING, description: "#RRGGBB 메인 색" },
    secondary: { type: Type.STRING, description: "#RRGGBB 어두운 색" },
    accent: { type: Type.STRING, description: "#RRGGBB 하이라이트 색" },
    mood: { type: Type.STRING, description: "두 글자 안팎의 한국어 분위기" },
    title: { type: Type.STRING, description: "캡슐 이름, 8자 이내" },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "한국어 키워드 4~6개",
    },
  },
};

function buildPrompt(input: {
  weather: CapsuleWeather | null;
  to: string;
  letter: string;
  reason: string;
}) {
  const weather = input.weather
    ? [
        `요약: ${input.weather.summary}`,
        `하늘: ${input.weather.skyLabel}`,
        `강수: ${input.weather.precipLabel}`,
        `기온: ${input.weather.temperature ?? "모름"}℃`,
        `습도: ${input.weather.humidity ?? "모름"}%`,
        `바람: ${input.weather.windSpeed ?? "모름"}m/s`,
      ].join("\n")
    : "날씨 정보 없음";

  return `너는 타임캡슐 디자이너다. 아래 날씨와 글을 보고 캡슐의 형태·색·키워드를 JSON으로만 정한다.

날씨:
${weather}

받는 사람: ${input.to.slice(0, 40) || "없음"}
묻은 이유: ${input.reason.slice(0, 300) || "없음"}
편지 일부: ${input.letter.slice(0, 400) || "없음"}

규칙:
- shape는 sun, cloud, rain, snow, wind, storm, mist, orb 중 하나만.
- 색은 반드시 #RRGGBB. 맑으면 따뜻하고 밝은색, 비면 블루·그레이, 눈이면 화이트·실버, 더우면 오렌지, 흐리면 뮤트톤.
- keywords는 한국어 명사 4~6개. 날씨 감각 + 묻은 이유를 섞는다. 해시태그 기호는 쓰지 않는다.
- title은 시적인 짧은 캡슐 이름.`;
}

async function generateWithModel(model: string, prompt: string) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: lookSchema,
    },
  });
  return JSON.parse(response.text ?? "{}") as Record<string, unknown>;
}

export async function generateCapsuleLook(input: {
  weather: CapsuleWeather | null;
  to: string;
  letter: string;
  reason: string;
}): Promise<CapsuleLook> {
  const fallback = fallbackLookFromWeather(input.weather ?? {});
  const prompt = buildPrompt(input);

  try {
    let raw: Record<string, unknown>;
    try {
      raw = await generateWithModel(MODEL, prompt);
    } catch {
      raw = await generateWithModel(FALLBACK_MODEL, prompt);
    }

    return {
      style: sanitizeStyle(raw, fallback.style),
      keywords: sanitizeKeywords(raw.keywords).length
        ? sanitizeKeywords(raw.keywords)
        : fallback.keywords,
    };
  } catch (error) {
    console.error(error);
    return fallback;
  }
}
