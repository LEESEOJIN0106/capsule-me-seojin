import { CapsuleDashboard } from "@/components/CapsuleDashboard";
import { WeatherShell } from "@/components/WeatherShell";

export default function MinePage() {
  return (
    <WeatherShell>
      <div className="flex flex-1">
        <CapsuleDashboard />
      </div>
    </WeatherShell>
  );
}
