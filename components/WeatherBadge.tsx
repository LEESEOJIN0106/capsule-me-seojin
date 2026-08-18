import { weatherEmoji, type CapsuleWeather } from "@/lib/weather";

export function WeatherBadge({
  weather,
  compact = false,
}: {
  weather: CapsuleWeather;
  compact?: boolean;
}) {
  const emoji = weatherEmoji(weather);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-stone-500">
        <span aria-hidden>{emoji}</span>
        {weather.summary}
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
      <p className="text-xs font-medium text-stone-400">묻은 날의 날씨</p>
      <p className="mt-1 text-sm font-medium text-stone-800">
        <span aria-hidden className="mr-1">
          {emoji}
        </span>
        {weather.summary}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        {weather.humidity != null ? `습도 ${weather.humidity}%` : null}
        {weather.humidity != null && weather.windSpeed != null ? " · " : null}
        {weather.windSpeed != null ? `바람 ${weather.windSpeed}m/s` : null}
        {weather.locationSource === "fallback" ? " · 서울 기준" : null}
      </p>
    </div>
  );
}
