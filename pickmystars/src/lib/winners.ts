import {
  get,
  increment,
  limitToLast,
  orderByChild,
  query,
  ref,
  update,
} from "firebase/database";
import { db } from "./firebase";
import type { Category, Idol } from "../data/idols";

const PATH = "idols";

export interface IdolRank {
  id: string;
  gender: Category;
  name: string;
  group: string;
  image: string;
  photo: string;
  wins: number;
}

// 월드컵 우승 횟수를 올립니다. 실패해도 게임 진행에는 영향을 주지 않습니다.
export function recordWinner(idol: Idol) {
  if (!db) return;
  update(ref(db, `${PATH}/${idol.id}`), { wins: increment(1) }).catch((error) =>
    console.warn("우승자 기록 실패:", error),
  );
}

export async function getRanking(max = 10): Promise<IdolRank[]> {
  if (!db) return [];
  const snapshot = await get(
    query(ref(db, PATH), orderByChild("wins"), limitToLast(max)),
  );
  const rows: IdolRank[] = [];
  snapshot.forEach((child) => {
    rows.push({ id: child.key, ...child.val() } as IdolRank);
  });
  return rows.reverse();
}
