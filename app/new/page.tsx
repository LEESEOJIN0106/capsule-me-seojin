"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "@/components/AuthProvider";
import { createCapsule, isFutureOpenAt, toDatetimeLocalValue } from "@/lib/capsules";
import { storage } from "@/lib/firebase";

type CapsuleResult = {
  capsuleId: string;
  to: string;
  letter: string;
  openAtLabel: string;
  imageUrls: string[];
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
  const [openAt, setOpenAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CapsuleResult | null>(null);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    setUploading(true);
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
      });

      setResult({
        capsuleId: docRef.id,
        to,
        letter,
        openAtLabel: formatOpenAt(openAt),
        imageUrls: publicUrl,
      });
    } catch (error) {
      console.error(error);
      alert("캡슐을 묻지 못했어요. 다시 시도해 주세요.");
    } finally {
      setUploading(false);
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
            캡슐이 묻혔어요.
          </p>

          <div className="mt-8 space-y-5 text-left">
            <div>
              <p className="text-xs font-medium text-stone-400">받는 사람</p>
              <p className="mt-1 text-sm text-stone-800">{result.to}</p>
            </div>
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

  return (
    <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16">
      <main className="relative w-full max-w-lg rounded-3xl border border-amber-100/80 bg-white/90 p-10 shadow-[0_20px_50px_-20px_rgba(120,80,40,0.25)]">
        {uploading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/80 backdrop-blur-sm">
            <p className="text-sm font-medium text-stone-700" aria-live="polite">
              업로드중…
            </p>
          </div>
        ) : null}

        <h1 className="text-center text-3xl font-semibold tracking-tight text-stone-800">
          캡슐 묻기
        </h1>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-left">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              받는 사람
            </span>
            <input
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              disabled={uploading}
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
              disabled={uploading}
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
              disabled={uploading}
              required
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 disabled:opacity-60"
            />
            <p className="mt-1.5 text-xs text-stone-400">
              지금보다 미래 날짜만 선택할 수 있어요.
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
              disabled={uploading}
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
            disabled={uploading}
            className="inline-flex w-full items-center justify-center rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "업로드중…" : "캡슐 묻기"}
          </button>
        </form>
      </main>
    </div>
  );
}
