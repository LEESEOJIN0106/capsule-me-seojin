const KEY = "capsule-me-draft";

export type CapsuleDraft = {
  to: string;
  letter: string;
  reason: string;
  openAt: string;
};

export function saveCapsuleDraft(draft: CapsuleDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private mode / quota
  }
}

export function readCapsuleDraft(): CapsuleDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CapsuleDraft>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      to: typeof parsed.to === "string" ? parsed.to : "",
      letter: typeof parsed.letter === "string" ? parsed.letter : "",
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
      openAt: typeof parsed.openAt === "string" ? parsed.openAt : "",
    };
  } catch {
    return null;
  }
}

export function clearCapsuleDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
