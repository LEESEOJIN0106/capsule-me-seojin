"use client";

import { useCurrentWeather } from "@/components/CurrentWeather";
import { WeatherScene } from "@/components/WeatherScene";

export function WeatherShell({ children }: { children: React.ReactNode }) {
  const { weather } = useCurrentWeather();

  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <WeatherScene weather={weather} variant="page" />
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
