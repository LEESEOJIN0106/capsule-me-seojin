"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/components/AuthProvider";
import { StyledCapsule } from "@/components/StyledCapsule";
import { WeatherBadge } from "@/components/WeatherBadge";
import { fetchCapsuleLook, type CapsuleLook } from "@/lib/capsule-style";
import { createCapsule, isFutureOpenAt, toDatetimeLocalValue } from "@/lib/capsules";
import { storage } from "@/lib/firebase";
import {
  fetchBurialWeather,
  getBrowserLocation,
  type CapsuleWeather,
} from "@/lib/weather";

type CapsuleResult = {
  capsuleId: string;
  to: string;
  letter: string;
  reason: string;
  openAtLabel: string;
  imageUrls: string[];
  weather: CapsuleWeather | null;
  look: CapsuleLook | null;
};

function getSafeExt(file: File): string {
  const mime = file.type.split("/")[1]?.toLowerCase();
  if (mime === "jpeg") return "jpg";
  if (mime && /^[a-z0-9]+$/.test(mime)) return mime;
  return "jpg";
}

function formatOpenAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR");
}

export default function NewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [to, setTo] = useState("");
  const [letter, setLetter] = useState("");
  const [reason, setReason] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [weather, setWeather] = useState<CapsuleWeather | null>(null);
  const [look, setLook] = useState<CapsuleLook | null>(null);
  const [result, setResult] = useState<CapsuleResult | null>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  async function handlePreview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      alert("로그인 먼저!");
      return;
    }

    if (!openAt) {
      alert("열람일을 선택해 주세요.");
      return;
    }

    if (!isFutureOpenAt(openAt)) {
      alert("열람일은 지금보다 미래로만 설정할 수 있어요.");
      return;
    }

    setBusy(true);
    setStatus("오늘의 날씨를 담는 중…");
    try {
      const coords = await getBrowserLocation();
      const nextWeather = await fetchBurialWeather(coords).catch(() => null);
      setWeather(nextWeather);

      setStatus("날씨로 캡슐 모양을 빚는 중…");
      const nextLook = await fetchCapsuleLook({
        weather: nextWeather,
        to,
        letter,
        reason,
      });
      setLook(nextLook);
    } catch (error) {
      console.error(error);
      alert("캡슐 모양을 만들지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  async function handleBury() {
    if (!user || !openAt) return;

    setBusy(true);
    setStatus("캡슐을 묻는 중…");
    try {
      const timestamp = Date.now();
      const publicUrl: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `capsules/${user.uid}/${timestamp}-${i}.${getSafeExt(file)}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file, {
          contentType: file.type || "image/jpeg",
        });
        publicUrl.push(await getDownloadURL(fileRef));
      }

      const docRef = await createCapsule({
        uid: user.uid,
        to,
        letter,
        openAt: new Date(openAt),
        imageUrls: publicUrl,
        weather,
        reason,
        keywords: look?.keywords ?? [],
        style: look?.style ?? null,
      });

      setResult({
        capsuleId: docRef.id,
        to,
        letter,
        reason,
        openAtLabel: formatOpenAt(openAt),
        imageUrls: publicUrl,
        weather,
        look,
      });
    } catch (error) {
      console.error(error);
      alert("캡슐을 묻지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  if (result) {
    return (
      <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16">
        <main className="w-full max-w-lg rounded-3xl border border-amber-100/80 bg-white/90 p-10 shadow-[0_20px_50px_-20px_rgba(120,80,40,0.25)]">
          <h1 className="text-center text-3xl font-semibold tracking-tight text-stone-800">
            결과
          </h1>
          <p className="mt-2 text-center text-sm text-stone-500">
            {result.look?.style.title ?? "캡슐"}이 묻혔어요.
          </p>

          {result.look ? (
            <div className="mt-8">
              <StyledCapsule style={result.look.style} size="lg" />
              <p className="mt-3 text-center text-sm text-stone-500">
                {result.look.style.mood}
              </p>
            </div>
          ) : null}

          <div className="mt-8 space-y-5 text-left">
            <div>
              <p className="text-xs font-medium text-stone-400">받는 사람</p>
              <p className="mt-1 text-sm text-stone-800">{result.to}</p>
            </div>
            {result.reason ? (
              <div>
                <p className="text-xs font-medium text-stone-400">묻은 이유</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                  {result.reason}
                </p>
              </div>
            ) : null}
            {result.look?.keywords.length ? (
              <div>
                <p className="text-xs font-medium text-stone-400">키워드</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.look.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-900"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium text-stone-400">편지</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {result.letter}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400">열람일</p>
              <p className="mt-1 text-sm text-stone-800">{result.openAtLabel}</p>
            </div>
            {result.weather ? <WeatherBadge weather={result.weather} /> : null}
            {result.imageUrls.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-stone-400">사진</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.imageUrls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-stone-700"
          >
            나가기
          </button>
        </main>
      </div>
    );
  }

  if (look) {
    return (
      <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16">
        <main className="relative w-full max-w-lg rounded-3xl border border-amber-100/80 bg-white/90 p-10 shadow-[0_20px_50px_-20px_rgba(120,80,40,0.25)]">
          {busy ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm">
              <p className="text-sm font-medium text-stone-700" aria-live="polite">
                {status || "묻는 중…"}
              </p>
            </div>
          ) : null}

          <h1 className="text-center text-3xl font-semibold tracking-tight text-stone-800">
            {look.style.title}
          </h1>
          <p className="mt-2 text-center text-sm text-stone-500">
            오늘의 날씨로 빚은 캡슐이에요. 이유를 다듬고 묻어 주세요.
          </p>

          <div className="mt-8">
            <StyledCapsule style={look.style} size="lg" />
          </div>

          {weather ? (
            <div className="mt-6">
              <WeatherBadge weather={weather} />
            </div>
          ) : null}

          <div className="mt-6">
            <p className="text-xs font-medium text-stone-400">키워드</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {look.keywords.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setLook({
                      ...look,
                      keywords: look.keywords.filter((item) => item !== keyword),
                    })
                  }
                  className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-900 transition hover:bg-amber-100"
                >
                  #{keyword} ×
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-stone-400">눌러서 뺄 수 있어요.</p>
          </div>

          <label className="mt-6 block text-left">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              왜 이 캡슐을 묻나요?
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 500))}
              rows={4}
              disabled={busy}
              placeholder="이 날씨, 이 순간에 묻고 싶은 이유를 남겨 주세요."
              className="w-full resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 disabled:opacity-60"
            />
          </label>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setLook(null)}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-60"
            >
              다시 만들기
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleBury()}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-stone-800 px-6 py-3.5 text-sm font-medium text-amber-50 transition hover:bg-stone-700 disabled:opacity-60"
            >
              이 캡슐 묻기
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16">
      <main className="relative w-full max-w-lg rounded-3xl border border-amber-100/80 bg-white/90 p-10 shadow-[0_20px_50px_-20px_rgba(120,80,40,0.25)]">
        {busy ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm">
            <p className="text-sm font-medium text-stone-700" aria-live="polite">
              {status || "만드는 중…"}
            </p>
          </div>
        ) : null}

        <h1 className="text-center text-3xl font-semibold tracking-tight text-stone-800">
          캡슐 묻기
        </h1>

        <form className="mt-8 space-y-5" onSubmit={handlePreview}>
          <label className="block text-left">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              받는 사람
            </span>
            <input
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              disabled={busy}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 disabled:opacity-60"
            />
          </label>

          <label className="block text-left">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              편지
            </span>
            <textarea
              value={letter}
              onChange={(event) => setLetter(event.target.value)}
              rows={6}
              disabled={busy}
              className="w-full resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 disabled:opacity-60"
            />
          </label>

          <label className="block text-left">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              왜 이 캡슐을 묻나요?
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, 500))}
              rows={3}
              disabled={busy}
              placeholder="예: 오늘 비가 와서, 조금 지친 마음을 나중에 다시 보고 싶어서"
              className="w-full resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 disabled:opacity-60"
            />
          </label>

          <label className="block text-left">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              열람일
            </span>
            <input
              type="datetime-local"
              value={openAt}
              min={toDatetimeLocalValue(new Date())}
              onChange={(event) => setOpenAt(event.target.value)}
              disabled={busy}
              required
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-stone-400">
              묻을 때 현재 날씨로 캡슐 색과 형태가 정해져요.
            </p>
          </label>

          <label className="block text-left">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              사진
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={(event) => {
                const selected = event.target.files;
                setFiles(selected ? Array.from(selected) : []);
              }}
              className="w-full text-sm text-stone-600 file:mr-3 file:rounded-full file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-amber-50 disabled:opacity-60"
            />
          </label>

          {previews.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {previews.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            날씨로 캡슐 만들기
          </button>
        </form>
      </main>
    </div>
  );
}
