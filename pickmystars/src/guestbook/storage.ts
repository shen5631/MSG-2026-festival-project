export const GUESTBOOK_KEY = "pickmystars.guestbook.v1";
export interface GuestbookEntry {
  id: string;
  nickname: string;
  message: string;
  idol: string;
  createdAt: number;
}
export function prepareEntry(
  nickname: string,
  message: string,
  idol = "",
): GuestbookEntry {
  const text = message.trim();
  if (!text || text.length > 150)
    throw new Error("한마디를 1~150자로 입력해주세요.");
  if (nickname.trim().length > 20)
    throw new Error("닉네임은 20자까지 입력할 수 있어요.");
  return {
    id: crypto.randomUUID(),
    nickname: nickname.trim() || "익명",
    message: text,
    idol,
    createdAt: Date.now(),
  };
}
export function readEntries(
  storage: Pick<Storage, "getItem">,
): GuestbookEntry[] {
  const raw = storage.getItem(GUESTBOOK_KEY);
  if (!raw) return [];
  const rows: unknown = JSON.parse(raw);
  if (!Array.isArray(rows)) throw new Error("저장한 방명록을 읽을 수 없어요.");
  return rows
    .filter(
      (row): row is GuestbookEntry =>
        !!row &&
        typeof row.id === "string" &&
        typeof row.nickname === "string" &&
        typeof row.message === "string" &&
        typeof row.idol === "string" &&
        Number.isFinite(row.createdAt),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}
export function saveEntry(
  storage: Pick<Storage, "getItem" | "setItem">,
  entry: GuestbookEntry,
) {
  const rows = [entry, ...readEntries(storage)];
  storage.setItem(GUESTBOOK_KEY, JSON.stringify(rows));
  return rows;
}
