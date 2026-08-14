"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { GoogleIcon } from "@/components/GoogleIcon";

export function AuthCard() {
  const { user, loading, error, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <p className="mt-10 text-sm text-stone-400" aria-live="polite">
        로그인 상태를 확인하는 중…
      </p>
    );
  }

  if (!user) {
    return (
      <div className="mt-10">
        <button
          type="button"
          onClick={() => void signIn()}
          className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 bg-white px-6 py-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50"
        >
          <GoogleIcon className="h-5 w-5" />
          Google로 계속하기
        </button>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-5">
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
