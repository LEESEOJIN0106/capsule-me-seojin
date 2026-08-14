"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CapsuleCard } from "@/components/CapsuleCard";
import {
  getCapsuleStatus,
  listCapsulesByUser,
  type CapsuleListItem,
} from "@/lib/capsules";

type Filter = "all" | "locked" | "open";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
      <p className="text-xs font-medium text-stone-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-800">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </div>
  );
}

export function CapsuleDashboard() {
  const { user } = useAuth();
  const [capsules, setCapsules] = useState<CapsuleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const items = await listCapsulesByUser(user.uid);
        if (!cancelled) setCapsules(items);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("캡슐 목록을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats = useMemo(() => {
    const locked = capsules.filter(
      (capsule) => getCapsuleStatus(capsule.openAt) === "locked",
    ).length;
    return {
      total: capsules.length,
      locked,
      open: capsules.length - locked,
    };
  }, [capsules]);

  const filteredCapsules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return capsules.filter((capsule) => {
      const status = getCapsuleStatus(capsule.openAt);
      if (filter === "locked" && status !== "locked") return false;
      if (filter === "open" && status !== "open") return false;
      if (!normalizedQuery) return true;

      return (
        capsule.to.toLowerCase().includes(normalizedQuery) ||
        capsule.letter.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [capsules, filter, query]);

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold text-stone-800">내 캡슐 대시보드</h1>
        <p className="mt-4 text-sm text-stone-500">
          로그인하면 묻어둔 캡슐을 한눈에 볼 수 있어요.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          처음으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.35em] text-amber-800/60">
            MY CAPSULES
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-800">
            내 캡슐 대시보드
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {user.displayName ?? "사용자"}님이 묻어둔 캡슐 {stats.total}개
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/new"
            className="inline-flex items-center justify-center rounded-full bg-stone-800 px-5 py-2.5 text-sm font-medium text-amber-50 transition hover:bg-stone-700"
          >
            + 새 캡슐 묻기
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
          >
            처음으로
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <StatCard label="전체" value={stats.total} hint="묻어둔 모든 캡슐" />
        <StatCard label="잠김" value={stats.locked} hint="아직 열리지 않음" />
        <StatCard label="열림" value={stats.open} hint="지금 열어볼 수 있음" />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "전체"],
            ["locked", "잠김"],
            ["open", "열림"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? "bg-stone-800 text-amber-50"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="받는 사람·편지 검색"
          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 outline-none ring-amber-200 transition focus:border-amber-300 focus:ring-2 sm:max-w-xs"
        />
      </div>

      {loading ? (
        <p className="mt-12 text-center text-sm text-stone-400">불러오는 중…</p>
      ) : error ? (
        <p className="mt-12 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : filteredCapsules.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-stone-200 bg-white/70 px-6 py-14 text-center">
          <p className="text-sm text-stone-500">
            {capsules.length === 0
              ? "아직 묻은 캡슐이 없어요."
              : "조건에 맞는 캡슐이 없어요."}
          </p>
          <Link
            href="/new"
            className="mt-6 inline-flex rounded-full bg-stone-800 px-6 py-3 text-sm font-medium text-amber-50 transition hover:bg-stone-700"
          >
            첫 캡슐 묻기
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCapsules.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      )}
    </div>
  );
}
