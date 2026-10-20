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
// Realtime Database의 guestbook 노드 값을 최신순 목록으로 바꿉니다.
export function parseEntries(value: unknown): GuestbookEntry[] {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error("방명록 자료를 읽을 수 없어요.");
  return Object.values(value as Record<string, unknown>)
    .filter(
      (row): row is GuestbookEntry =>
        !!row &&
        typeof row === "object" &&
        typeof (row as GuestbookEntry).id === "string" &&
        typeof (row as GuestbookEntry).nickname === "string" &&
        typeof (row as GuestbookEntry).message === "string" &&
        typeof (row as GuestbookEntry).idol === "string" &&
        Number.isFinite((row as GuestbookEntry).createdAt),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}
