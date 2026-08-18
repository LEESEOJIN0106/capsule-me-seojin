"use client";

import Link from "next/link";
import {
  formatCapsuleDate,
  getCapsuleStatus,
  getDaysUntilOpen,
  type CapsuleListItem,
} from "@/lib/capsules";
import { StyledCapsule } from "@/components/StyledCapsule";
import { WeatherBadge } from "@/components/WeatherBadge";

export function CapsuleCard({ capsule }: { capsule: CapsuleListItem }) {
  const status = getCapsuleStatus(capsule.openAt);
  const daysLeft = getDaysUntilOpen(capsule.openAt);
  const thumbnail = capsule.imageUrls[0];

  return (
    <Link
      href={`/capsule/${capsule.id}`}
      className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:border-amber-200 hover:shadow-md"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{
          background: capsule.style
            ? `linear-gradient(160deg, ${capsule.style.accent}, ${capsule.style.primary} 55%, ${capsule.style.secondary})`
            : undefined,
        }}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className={`h-full w-full object-cover transition ${
              status === "locked" ? "blur-sm brightness-90" : "group-hover:scale-[1.02]"
            }`}
          />
        ) : capsule.style ? (
          <div className="flex h-full items-center justify-center">
            <StyledCapsule style={capsule.style} size="sm" />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-stone-100 text-4xl">
            💌
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${
            status === "locked"
              ? "bg-stone-800/85 text-amber-50"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {status === "locked" ? "잠김" : "열림"}
        </span>
        {capsule.imageUrls.length > 1 ? (
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white">
            +{capsule.imageUrls.length - 1}
          </span>
        ) : null}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-stone-800">
            {capsule.to || "받는 사람 없음"}
          </p>
        </div>
        <p className="line-clamp-2 text-sm text-stone-500">
          {status === "locked"
            ? capsule.style?.title
              ? `${capsule.style.title} · 열람일까지 잠겨 있어요.`
              : "열람일까지 편지가 잠겨 있어요."
            : capsule.letter || "편지 없음"}
        </p>
        {capsule.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {capsule.keywords.slice(0, 3).map((keyword) => (
              <span key={keyword} className="text-[11px] text-amber-800/80">
                #{keyword}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-stone-400">
          <span>{formatCapsuleDate(capsule.openAt)}</span>
          {status === "locked" && daysLeft > 0 ? (
            <span className="font-medium text-amber-800">D-{daysLeft}</span>
          ) : null}
        </div>
        {capsule.weather ? (
          <WeatherBadge weather={capsule.weather} compact />
        ) : null}
      </div>
    </Link>
  );
}
