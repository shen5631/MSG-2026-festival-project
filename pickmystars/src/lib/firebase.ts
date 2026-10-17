import { initializeApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

const options = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// 로컬에 Firebase 설정이 없어도 월드컵과 카메라는 사용할 수 있습니다.
function initializeDatabase(): Database | null {
  if (!options.projectId && !options.databaseURL) return null;
  try {
    return getDatabase(initializeApp(options));
  } catch (error) {
    console.warn("통계 데이터베이스 초기화 실패:", error);
    return null;
  }
}

export const db = initializeDatabase();
