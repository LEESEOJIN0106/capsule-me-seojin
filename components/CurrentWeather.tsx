"use client";

import { useCallback, useEffect, useState } from "react";
import { WeatherScene } from "@/components/WeatherScene";
import {
  fetchCurrentWeather,
  weatherFeel,
  weatherInk,
  weatherObservedAt,
  weatherPlaceLabel,
  weatherStats,
  type CapsuleWeather,
} from "@/lib/weather";

const REFRESH_MS = 10 * 60 * 1000;

function LocationPin({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-6.2 7-11.2A7 7 0 1 0 5 9.8C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.2" />
    </svg>
  );
}

export function useCurrentWeather() {
  const [weather, setWeather] = useState<CapsuleWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async (force = false) => {
    setError(false);
    try {
      const next = await fetchCurrentWeather(force);
      setWeather(next);
      if (!next) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);

    const timer = window.setInterval(() => {
      void refresh(true);
    }, REFRESH_MS);

    function onVisible() {
      if (document.visibilityState === "visible") void refresh(false);
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { weather, loading, error, refresh };
}

export function WeatherPanel({
  weather,
  caption,
  variant = "panel",
  live = false,
}: {
  weather: CapsuleWeather;
  caption?: string;
  variant?: "panel" | "strip";
  live?: boolean;
}) {
  const place = weatherPlaceLabel(weather);
  const observed = weatherObservedAt(weather);
  const feel = weatherFeel(weather);
  const ink = weatherInk(weather);
  const stats = weatherStats(weather);
  const light = ink === "light";

  if (variant === "strip") {
    return (
      <div className="relative min-h-[72px] overflow-hidden rounded-2xl border border-white/40 shadow-[0_12px_30px_-18px_rgba(40,30,10,0.45)]">
        <WeatherScene weather={weather} variant="strip" />
        <div
          className={`relative z-[1] flex items-end justify-between gap-3 px-4 py-3 ${
            light ? "text-white" : "text-stone-800"
          }`}
        >
          <div className="min-w-0">
            <p className="text-[2rem] leading-none font-semibold tracking-tight tabular-nums">
              {weather.temperature != null ? (
                <>
                  {weather.temperature}
                  <span className="ml-0.5 text-base font-medium opacity-70">℃</span>
                </>
              ) : (
                <span className="text-base font-medium">{feel}</span>
              )}
            </p>
            <p
              className={`mt-1 truncate text-xs ${
                light ? "text-white/80" : "text-stone-600"
              }`}
            >
              {feel}
            </p>
          </div>
          <p
            className={`flex max-w-[46%] items-center gap-1 truncate text-xs ${
              light ? "text-white/75" : "text-stone-600"
            }`}
          >
            <LocationPin className="h-3 w-3 shrink-0" />
            {place}
            {live && weather.locationSource === "fallback" ? " 기준" : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[228px] overflow-hidden rounded-3xl border border-white/40 shadow-[0_18px_40px_-24px_rgba(40,30,10,0.5)]">
      <WeatherScene weather={weather} variant="panel" />
      <div
        className={`relative z-[1] px-5 py-5 ${
          light ? "text-white" : "text-stone-800"
        }`}
      >
        <p
          className={`text-xs font-medium tracking-wide ${
            light ? "text-white/70" : "text-stone-600/80"
          }`}
        >
          {caption ?? (live ? "지금 여기" : "묻은 날의 날씨")}
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <p className="text-5xl font-semibold tracking-tight tabular-nums">
            {weather.temperature != null ? (
              <>
                {weather.temperature}
                <span
                  className={`ml-0.5 text-2xl font-medium ${
                    light ? "text-white/70" : "text-stone-600"
                  }`}
                >
                  ℃
                </span>
              </>
            ) : (
              <span className="text-2xl">{feel}</span>
            )}
          </p>
        </div>
        <p className="mt-2 text-base font-medium">{feel}</p>
        <p
          className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${
            light ? "text-white/85" : "text-stone-700"
          }`}
        >
          <LocationPin
            className={`h-4 w-4 shrink-0 ${
              light ? "text-white/80" : "text-amber-900/70"
            }`}
          />
          {place}
        </p>
        {stats.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.map((stat) => (
              <span
                key={stat.label}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  light
                    ? "bg-white/15 text-white/90"
                    : "bg-black/10 text-stone-700"
                }`}
              >
                {stat.label} {stat.value}
              </span>
            ))}
          </div>
        ) : null}
        {observed ? (
          <p
            className={`mt-3 text-xs ${
              light ? "text-white/55" : "text-stone-500"
            }`}
          >
            {observed} 기준
          </p>
        ) : null}
        {live && weather.locationSource === "fallback" ? (
          <p
            className={`mt-2 text-xs ${
              light ? "text-white/55" : "text-stone-400"
            }`}
          >
            위치 권한을 허용하면 지금 있는 곳 날씨로 바뀌어요.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function LiveWeather({
  variant = "panel",
}: {
  variant?: "panel" | "strip";
}) {
  const { weather, loading, error, refresh } = useCurrentWeather();

  if (loading && !weather) {
    return (
      <div
        className={`relative overflow-hidden ${
          variant === "strip" ? "h-[72px] rounded-2xl" : "h-[220px] rounded-3xl"
        }`}
        aria-live="polite"
      >
        <WeatherScene weather={null} variant={variant} />
        <span className="sr-only">지금 날씨를 불러오는 중</span>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <button
        type="button"
        onClick={() => void refresh(true)}
        className={`w-full border border-dashed border-stone-200 bg-white/70 text-left text-sm text-stone-500 transition hover:border-amber-200 hover:bg-amber-50/50 ${
          variant === "strip" ? "rounded-2xl px-4 py-3" : "rounded-3xl px-5 py-5"
        }`}
      >
        날씨를 불러오지 못했어요. 눌러서 다시 시도
      </button>
    );
  }

  if (!weather) return null;

  return <WeatherPanel weather={weather} variant={variant} live />;
}
