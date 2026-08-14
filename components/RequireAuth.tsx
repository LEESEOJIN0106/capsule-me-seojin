"use client";

import { useAuth } from "@/components/AuthProvider";
import { GoogleIcon } from "@/components/GoogleIcon";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signIn } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16">
        <p className="text-sm text-stone-400">로그인 상태를 확인하는 중…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-amber-50 px-6 py-16">
        <main className="w-full max-w-md rounded-3xl border border-amber-100/80 bg-white/90 p-12 text-center shadow-[0_20px_50px_-20px_rgba(120,80,40,0.25)]">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
            로그인이 필요해요
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-500">
            캡슐을 묻으려면 Google 계정으로 로그인해 주세요.
          </p>
          <button
            type="button"
            onClick={() => void signIn()}
            className="mt-10 inline-flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            <GoogleIcon className="h-5 w-5" />
            Google로 계속하기
          </button>
          {error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
