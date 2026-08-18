import { WeatherShell } from "@/components/WeatherShell";

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return <WeatherShell>{children}</WeatherShell>;
}
