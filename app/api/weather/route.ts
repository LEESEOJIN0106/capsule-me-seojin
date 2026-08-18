import { getBurialWeather } from "@/lib/kma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    const weather = await getBurialWeather({
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    });

    return Response.json({ weather });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "날씨를 불러오지 못했어요." },
      { status: 502 },
    );
  }
}
