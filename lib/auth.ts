import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "";
      case "auth/popup-blocked":
        return "팝업이 차단되었습니다. 브라우저에서 팝업을 허용해 주세요.";
      case "auth/unauthorized-domain":
        return "이 도메인은 로그인에 허용되지 않았습니다. Firebase 인증 설정에서 도메인을 추가해 주세요.";
      case "auth/operation-not-allowed":
        return "Google 로그인이 아직 활성화되지 않았습니다.";
      default:
        return error.message;
    }
  }
  return "로그인 중 문제가 발생했습니다.";
}

export async function signInWithGoogle(): Promise<User> {
  auth.languageCode = "ko";
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
