import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CapsuleStyle } from "@/lib/capsule-style";
import type { CapsuleWeather } from "@/lib/weather";

export type CapsuleData = {
  uid: string;
  to: string;
  letter: string;
  openAt: Timestamp;
  imageUrls: string[];
  createdAt: ReturnType<typeof serverTimestamp>;
};

export type CapsuleListItem = {
  id: string;
  to: string;
  letter: string;
  openAt: Timestamp;
  imageUrls: string[];
  createdAt: Timestamp | null;
  weather: CapsuleWeather | null;
  reason: string;
  keywords: string[];
  style: CapsuleStyle | null;
};

export type CapsuleStatus = "locked" | "open";

export function getCapsuleStatus(
  openAt: Timestamp,
  now = Date.now(),
): CapsuleStatus {
  return openAt.toMillis() <= now ? "open" : "locked";
}

export function getDaysUntilOpen(openAt: Timestamp, now = Date.now()) {
  const diff = openAt.toMillis() - now;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getRemainingTime(openAt: Timestamp, now = Date.now()) {
  const totalMs = Math.max(0, openAt.toMillis() - now);
  const seconds = Math.floor(totalMs / 1000) % 60;
  const minutes = Math.floor(totalMs / (1000 * 60)) % 60;
  const hours = Math.floor(totalMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, totalMs };
}

export function formatRemainingTime(openAt: Timestamp, now = Date.now()) {
  const { days, hours, minutes, seconds, totalMs } = getRemainingTime(openAt, now);
  if (totalMs <= 0) return "곧 열려요";

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}일`);
  parts.push(`${hours}시간`);
  parts.push(`${minutes}분`);
  parts.push(`${seconds}초`);
  return parts.join(" ");
}

export function formatCapsuleDate(value: Timestamp) {
  return value.toDate().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isFutureOpenAt(value: Date | string, now = Date.now()) {
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > now;
}

const capsuleStatsRef = doc(db, "stats", "capsules");

export async function getPublicCapsuleCount(): Promise<number> {
  const snap = await getDoc(capsuleStatsRef);
  const count = snap.data()?.count;
  return typeof count === "number" && Number.isFinite(count) ? count : 0;
}

async function incrementPublicCapsuleCount() {
  await setDoc(capsuleStatsRef, { count: increment(1) }, { merge: true });
}

export async function createCapsule(input: {
  uid: string;
  to: string;
  letter: string;
  openAt: Date;
  imageUrls: string[];
  weather?: CapsuleWeather | null;
  reason?: string;
  keywords?: string[];
  style?: CapsuleStyle | null;
}) {
  const docRef = await addDoc(collection(db, "capsules"), {
    uid: input.uid,
    to: input.to,
    letter: input.letter,
    openAt: Timestamp.fromDate(input.openAt),
    imageUrls: input.imageUrls,
    createdAt: serverTimestamp(),
    reason: input.reason ?? "",
    keywords: input.keywords ?? [],
    ...(input.weather ? { weather: input.weather } : {}),
    ...(input.style ? { style: input.style } : {}),
  });

  try {
    await incrementPublicCapsuleCount();
  } catch (error) {
    console.error(error);
  }

  return docRef;
}

export async function listCapsulesByUser(uid: string): Promise<CapsuleListItem[]> {
  const snapshot = await getDocs(
    query(collection(db, "capsules"), where("uid", "==", uid)),
  );

  const items = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      to: data.to ?? "",
      letter: data.letter ?? "",
      openAt: data.openAt as Timestamp,
      imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
      createdAt: (data.createdAt as Timestamp | undefined) ?? null,
      weather: (data.weather as CapsuleWeather | undefined) ?? null,
      reason: typeof data.reason === "string" ? data.reason : "",
      keywords: Array.isArray(data.keywords)
        ? data.keywords.filter((item: unknown) => typeof item === "string")
        : [],
      style: (data.style as CapsuleStyle | undefined) ?? null,
    };
  });

  return items.sort((a, b) => a.openAt.toMillis() - b.openAt.toMillis());
}
