"use client";

import { useEffect } from "react";
import { getClientAnalytics } from "@/lib/firebase";

/** 클라이언트에서 Firebase Analytics를 한 번 초기화합니다. */
export function FirebaseAnalytics() {
  useEffect(() => {
    void getClientAnalytics();
  }, []);

  return null;
}
