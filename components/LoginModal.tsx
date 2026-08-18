"use client";

import { useEffect } from "react";
import { GoogleIcon } from "@/components/GoogleIcon";

export function LoginModal({
  open,
  error,
  onClose,
  onSignIn,
}: {
  open: boolean;
  error: string;
  onClose: () => void;
  onSignIn: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-3xl border border-amber-100/80 bg-white p-8 text-center shadow-[0_20px_50px_-20px_rgba(120,80,40,0.35)]">
        <p className="text-xs font-medium tracking-[0.35em] text-amber-800/60">
          TIME CAPSULE
        </p>
        <h2
          id="login-modal-title"
          className="mt-3 text-2xl font-semibold tracking-tight text-stone-800"
        >
          이 캡슐을 묻으려면
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          Google 계정으로 로그인하면 편지와 열람일이 안전하게 보관돼요.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
        >
          <GoogleIcon className="h-5 w-5" />
          Google로 계속하기
        </button>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 text-sm text-stone-400 underline-offset-4 transition hover:text-stone-600 hover:underline"
        >
          조금 더 적어 볼게요
        </button>
      </div>
    </div>
  );
}
