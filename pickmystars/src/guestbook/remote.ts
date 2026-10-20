import {
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
  set,
} from "firebase/database";
import { db } from "../lib/firebase";
import { parseEntries, type GuestbookEntry } from "./storage";

const PATH = "guestbook";
const MAX_ENTRIES = 300;
const SAVE_TIMEOUT_MS = 10000;

// 새 글이 올라오면 바로 받아 옵니다. 반환값은 구독을 끊는 함수입니다.
export function subscribeEntries(
  onEntries: (entries: GuestbookEntry[]) => void,
  onError: (error: Error) => void,
) {
  if (!db) {
    onError(new Error("Firebase 설정이 없어요."));
    return () => {};
  }
  return onValue(
    query(ref(db, PATH), orderByChild("createdAt"), limitToLast(MAX_ENTRIES)),
    (snapshot) => {
      try {
        onEntries(parseEntries(snapshot.val()));
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    (error) => onError(error),
  );
}

// 오프라인이면 응답이 오지 않으므로 제한 시간 안에 저장되지 않으면 실패로 처리합니다.
export async function addEntry(entry: GuestbookEntry) {
  if (!db) throw new Error("Firebase 설정이 없어요.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      set(ref(db, `${PATH}/${entry.id}`), entry),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("저장 시간이 초과됐어요.")),
          SAVE_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
