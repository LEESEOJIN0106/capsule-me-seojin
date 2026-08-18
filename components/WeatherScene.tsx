"use client";

import { useMemo } from "react";
import {
  parseRainfallMm,
  weatherInk,
  weatherMood,
  weatherPeriod,
  type CapsuleWeather,
  type WeatherMood,
  type WeatherPeriod,
} from "@/lib/weather";

type SceneVariant = "page" | "panel" | "strip";

function particleField(count: number, salt: number) {
  return Array.from({ length: count }, (_, index) => ({
    left: `${((index * 47 + salt * 13) % 97) + 1.5}%`,
    delay: `${((index * 0.19 + salt * 0.07) % 2.6).toFixed(2)}s`,
    duration: `${(0.85 + ((index * 17 + salt) % 16) / 10).toFixed(2)}s`,
    drift: `${(((index * 11) % 17) - 8) * 1.4}px`,
    size: 2 + ((index * 3) % 5),
  }));
}

function cloudCount(mood: WeatherMood) {
  if (mood === "sun") return 2;
  if (mood === "wind") return 3;
  if (mood === "cloud") return 4;
  if (mood === "mist" || mood === "rain" || mood === "storm") return 5;
  return 3;
}

export function WeatherScene({
  weather,
  variant = "panel",
}: {
  weather: CapsuleWeather | null;
  variant?: SceneVariant;
}) {
  const mood: WeatherMood = weather ? weatherMood(weather) : "sun";
  const period: WeatherPeriod = weather ? weatherPeriod(weather) : "day";
  const ink = weather ? weatherInk(weather) : "dark";
  const wind = weather?.windSpeed ?? 1;
  const rainMm = weather ? parseRainfallMm(weather.rainfall) : 0;
  const humidity = weather?.humidity ?? 45;

  const rainCount =
    mood === "storm"
      ? 28
      : mood === "rain"
        ? Math.min(10 + Math.round(rainMm * 5), 26)
        : 0;
  const snowCount = mood === "snow" ? 16 : 0;
  const starCount = period === "night" ? 18 : period === "dusk" ? 8 : 0;

  const rain = useMemo(
    () => particleField(rainCount, Math.round(wind * 10)),
    [rainCount, wind],
  );
  const snow = useMemo(
    () => particleField(snowCount, 21),
    [snowCount],
  );
  const stars = useMemo(
    () => particleField(starCount, 7),
    [starCount],
  );

  const tilt = Math.min(18, 4 + wind * 1.4);
  const mist = mood === "mist" || humidity >= 78;

  return (
    <div
      className={`wx-scene wx-scene--${variant}`}
      data-mood={mood}
      data-period={period}
      data-ink={ink}
      style={{
        ["--wx-wind" as string]: String(Math.max(0.4, wind)),
        ["--wx-tilt" as string]: `${tilt}deg`,
        ["--wx-rain" as string]: String(Math.max(0.6, rainMm || 1)),
      }}
      aria-hidden
    >
      <div className="wx-sky" />
      {period === "night" || period === "dusk" ? (
        <span className="wx-moon" />
      ) : (
        <span className="wx-sun">
          <i />
        </span>
      )}
      {stars.map((star, index) => (
        <span
          key={`star-${index}`}
          className="wx-star"
          style={{
            left: star.left,
            top: `${12 + (index * 9) % 48}%`,
            animationDelay: star.delay,
            width: star.size,
            height: star.size,
          }}
        />
      ))}
      {Array.from({ length: cloudCount(mood) }, (_, index) => (
        <span
          key={`cloud-${index}`}
          className={`wx-cloud wx-cloud-${index + 1}`}
          style={{ animationDelay: `${index * 0.8}s` }}
        />
      ))}
      {mist ? <span className="wx-mist" /> : null}
      {rain.length > 0 ? (
        <span className="wx-rain">
          {rain.map((drop, index) => (
            <i
              key={`rain-${index}`}
              style={{
                left: drop.left,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
                height: 10 + (index % 8),
              }}
            />
          ))}
        </span>
      ) : null}
      {snow.map((flake, index) => (
        <span
          key={`snow-${index}`}
          className="wx-snow"
          style={{
            left: flake.left,
            animationDelay: flake.delay,
            animationDuration: `${2.2 + (index % 5) * 0.35}s`,
            width: flake.size,
            height: flake.size,
            ["--wx-drift" as string]: flake.drift,
          }}
        />
      ))}
      {wind >= 3 || mood === "wind" ? (
        <span className="wx-gusts">
          {Array.from({ length: wind >= 8 ? 5 : 3 }, (_, index) => (
            <i key={index} style={{ animationDelay: `${index * 0.35}s` }} />
          ))}
        </span>
      ) : null}
      {mood === "storm" || weather?.lightning ? <span className="wx-flash" /> : null}
    </div>
  );
}
