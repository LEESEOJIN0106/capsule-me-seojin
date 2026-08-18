import { WeatherPanel } from "@/components/CurrentWeather";
import {
  weatherFeel,
  weatherShortPlace,
  type CapsuleWeather,
} from "@/lib/weather";

export function WeatherBadge({
  weather,
  compact = false,
}: {
  weather: CapsuleWeather;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-stone-500">
        {weatherFeel(weather)}
        <span className="text-stone-300">·</span>
        {weatherShortPlace(weather)}
      </span>
    );
  }

  return <WeatherPanel weather={weather} caption="묻은 날의 날씨" />;
}
