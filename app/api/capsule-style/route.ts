import { generateCapsuleLook } from "@/lib/gemini";
import type { CapsuleWeather } from "@/lib/weather";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      weather?: CapsuleWeather | null;
      to?: string;
      letter?: string;
      reason?: string;
    };

    const look = await generateCapsuleLook({
      weather: body.weather ?? null,
      to: typeof body.to === "string" ? body.to : "",
      letter: typeof body.letter === "string" ? body.letter : "",
      reason: typeof body.reason === "string" ? body.reason : "",
    });

    return Response.json(look);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "캡슐 모양을 만들지 못했어요." },
      { status: 502 },
    );
  }
}
