"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, getDoc, type Timestamp } from "firebase/firestore";
import {
  formatCapsuleDate,
  formatRemainingTime,
  getCapsuleStatus,
  getDaysUntilOpen,
} from "@/lib/capsules";
import { db } from "@/lib/firebase";

type CapsuleDoc = {
  to: string;
  letter: string;
  openAt: Timestamp;
  imageUrls: string[];
};

function CapsuleContent({ capsule }: { capsule: CapsuleDoc }) {
  return (
    <>
      <div>
        <p className="text-xs font-medium text-stone-400">편지</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
          {capsule.letter || "편지 없음"}
        </p>
      </div>
      {capsule.imageUrls.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-stone-400">사진</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {capsule.imageUrls.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function CapsuleDetail({ id }: { id: string }) {
  const [capsule, setCapsule] = useState<CapsuleDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [devPreview, setDevPreview] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const snapshot = await getDoc(doc(db, "capsules", id));
        if (cancelled) return;

        if (!snapshot.exists()) {
          setCapsule(null);
          setError("캡슐을 찾을 수 없어요.");
          return;
        }

        const data = snapshot.data();
        setCapsule({
          to: data.to ?? "",
          letter: data.letter ?? "",
          openAt: data.openAt,
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        });
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("캡슐을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <p className="mt-6 text-sm text-stone-400">캡슐을 불러오는 중…</p>
    );
  }

  if (error || !capsule) {
    return (
      <p className="mt-6 text-sm text-red-600" role="alert">
        {error || "캡슐을 찾을 수 없어요."}
      </p>
    );
  }

  const status = getCapsuleStatus(capsule.openAt, now);
  const daysLeft = getDaysUntilOpen(capsule.openAt, now);
  const canViewContent = status === "open" || devPreview;

  return (
    <div className="mt-6 space-y-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === "locked"
              ? "bg-stone-800 text-amber-50"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {status === "locked" ? "잠김" : "열림"}
        </span>
        {status === "locked" && daysLeft > 0 ? (
          <span className="text-xs font-medium text-amber-800">D-{daysLeft}</span>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-medium text-stone-400">받는 사람</p>
        <p className="mt-1 text-base font-medium text-stone-800">
          {capsule.to || "받는 사람 없음"}
        </p>
      </div>

      {!canViewContent ? (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-5 text-center">
          <p className="text-sm font-semibold text-stone-800">아직 기한이 남았어요</p>
          <p
            className="mt-3 font-mono text-lg font-medium tracking-wide text-amber-900"
            aria-live="polite"
          >
            {formatRemainingTime(capsule.openAt, now)}
          </p>
          <p className="mt-3 text-sm text-stone-600">
            {formatCapsuleDate(capsule.openAt)} 이후에 열 수 있어요
          </p>
          {isDev ? (
            <button
              type="button"
              onClick={() => setDevPreview(true)}
              className="mt-5 text-xs text-stone-300 transition hover:text-stone-400"
            >
              바로 보기
            </button>
          ) : null}
        </div>
      ) : (
        <>
          {devPreview && status === "locked" ? (
            <p className="text-xs text-stone-300">개발 모드 미리보기</p>
          ) : null}
          <CapsuleContent capsule={capsule} />
        </>
      )}

      <div>
        <p className="text-xs font-medium text-stone-400">열람일</p>
        <p className="mt-1 text-sm text-stone-800">
          {formatCapsuleDate(capsule.openAt)}
        </p>
      </div>

      <Link
        href="/mine"
        className="inline-flex w-full items-center justify-center rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
      >
        대시보드로
      </Link>
    </div>
  );
}
