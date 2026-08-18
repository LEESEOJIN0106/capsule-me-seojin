import { AuthCard } from "@/components/AuthCard";
import { WeatherShell } from "@/components/WeatherShell";

export default function Home() {
  return (
    <WeatherShell>
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <main className="w-full max-w-lg rounded-3xl border border-white/50 bg-white/80 p-10 text-center shadow-[0_20px_50px_-20px_rgba(40,30,10,0.35)] backdrop-blur-md">
          <p className="mb-4 text-xs font-medium tracking-[0.35em] text-amber-800/60">
            TIME CAPSULE
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-stone-800">
            캡슐 미
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-stone-500">
            사진과 편지를 묻고 열람일에 함께열어요
          </p>
          <AuthCard />
        </main>
      </div>
    </WeatherShell>
  );
}
