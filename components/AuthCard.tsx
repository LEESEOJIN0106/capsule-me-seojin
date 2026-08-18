"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LiveWeather } from "@/components/CurrentWeather";
import { LoginModal } from "@/components/LoginModal";
import { StyledCapsule } from "@/components/StyledCapsule";
import { saveCapsuleDraft } from "@/lib/capsule-draft";
import { getPublicCapsuleCount, toDatetimeLocalValue } from "@/lib/capsules";
import type { CapsuleStyle } from "@/lib/capsule-style";

const PREVIEW_STYLE: CapsuleStyle = {
  shape: "orb",
  primary: "#E8C872",
  secondary: "#8B6914",
  accent: "#FFF6D8",
  mood: "아늑",
  title: "시간의 캡슐",
};

function CapsuleCount({
  count,
  loading,
}: {
  count: number | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-5 py-4">
      <p className="text-xs font-medium tracking-wide text-amber-800/70">
        지금까지 묻힌 캡슐
      </p>
      {loading ? (
        <p
          className="mt-1 h-8 w-20 animate-pulse rounded-lg bg-amber-100"
          aria-live="polite"
        >
          <span className="sr-only">캡슐 개수를 불러오는 중</span>
        </p>
      ) : (
        <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-stone-800">
          {(count ?? 0).toLocaleString("ko-KR")}
          <span className="ml-1 text-sm font-medium text-stone-500">개</span>
        </p>
      )}
    </div>
  );
}

export function AuthCard() {
  const router = useRouter();
  const { user, loading, error, signIn, signOut } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [to, setTo] = useState("");
  const [letter, setLetter] = useState("");
  const [openAt, setOpenAt] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await getPublicCapsuleCount();
        if (!cancelled) setCount(next);
      } catch (err) {
        console.error(err);
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setCountLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || !user || !loginOpen) return;
    setLoginOpen(false);
    router.push("/new");
  }, [user, loginOpen, loading, router]);

  function handleBury(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCapsuleDraft({ to, letter, reason: "", openAt });
    if (!loading) setLoginOpen(true);
  }

  if (!user) {
    return (
      <div className="mt-8 space-y-5 text-left">
        <CapsuleCount count={count} loading={countLoading} />
        <StyledCapsule style={PREVIEW_STYLE} size="md" />
        <LiveWeather variant="strip" />
        <form className="space-y-4" onSubmit={handleBury}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              받는 사람
            </span>
            <input
              type="text"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="미래의 나에게, 친구에게"
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              편지
            </span>
            <textarea
              value={letter}
              onChange={(event) => setLetter(event.target.value)}
              rows={4}
              placeholder="지금 이 순간의 마음을 적어 주세요."
              className="w-full resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-stone-600">
              열람일
            </span>
            <input
              type="datetime-local"
              value={openAt}
              min={toDatetimeLocalValue(new Date())}
              onChange={(event) => setOpenAt(event.target.value)}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            캡슐 묻기
          </button>
        </form>
        <LoginModal
          open={loginOpen}
          error={error}
          onClose={() => setLoginOpen(false)}
          onSignIn={() => void signIn()}
        />
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-5">
      <CapsuleCount count={count} loading={countLoading} />
      <div className="flex items-center justify-center gap-3">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
            unoptimized
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-200 text-sm font-medium text-stone-600">
            {(user.displayName ?? user.email ?? "?").slice(0, 1)}
          </div>
        )}
        <div className="text-left">
          <p className="text-sm font-medium text-stone-800">
            {user.displayName ?? "사용자"}
          </p>
          {user.email ? (
            <p className="text-xs text-stone-500">{user.email}</p>
          ) : null}
        </div>
      </div>
      <LiveWeather variant="strip" />
      <Link
        href="/new"
        className="inline-flex w-full items-center justify-center rounded-full bg-stone-800 px-8 py-3.5 text-sm font-medium text-amber-50 shadow-sm transition hover:bg-stone-700"
      >
        캡슐 묻으러 가기
      </Link>
      <Link
        href="/mine"
        className="inline-flex w-full items-center justify-center rounded-full border border-stone-200 bg-white px-8 py-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
      >
        내 캡슐 대시보드
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-sm text-stone-400 underline-offset-4 transition hover:text-stone-600 hover:underline"
      >
        로그아웃
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
