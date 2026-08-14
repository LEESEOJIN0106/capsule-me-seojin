"use client";

import Link from "next/link";
import {
  formatCapsuleDate,
  getCapsuleStatus,
  getDaysUntilOpen,
  type CapsuleListItem,
} from "@/lib/capsules";

export function CapsuleCard({ capsule }: { capsule: CapsuleListItem }) {
  const status = getCapsuleStatus(capsule.openAt);
  const daysLeft = getDaysUntilOpen(capsule.openAt);
  const thumbnail = capsule.imageUrls[0];

  return (
    <Link
      href={`/capsule/${capsule.id}`}
      className="group overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:border-amber-200 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-stone-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className={`h-full w-full object-cover transition ${
              status === "locked" ? "blur-sm brightness-90" : "group-hover:scale-[1.02]"
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
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
          {status === "locked" ? "열람일까지 편지가 잠겨 있어요." : capsule.letter || "편지 없음"}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1 text-xs text-stone-400">
          <span>{formatCapsuleDate(capsule.openAt)}</span>
          {status === "locked" && daysLeft > 0 ? (
            <span className="font-medium text-amber-800">D-{daysLeft}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
