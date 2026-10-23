export const STRIP_WIDTH = 1280;
export const STRIP_HEIGHT = 3434;
export const DECORATE_SECONDS = 180;
export const MAX_STICKERS = 24;

// 투명 스티커 시트의 각 요소를 잘라 표시하는 원본 픽셀 영역입니다.
export const stickerCatalog = [
  { id: "round-glasses", name: "동그란 안경", rect: [20, 75, 410, 190] },
  {
    id: "kitty-glasses",
    name: "헬로키티 안경",
    rect: [20, 210, 595, 295],
    sheet: "extras",
  },
  {
    id: "black-star",
    name: "검정 도트 별",
    rect: [720, 140, 450, 420],
    sheet: "extras",
  },
  {
    id: "dot-bow",
    name: "도트 리본",
    rect: [50, 725, 530, 390],
    sheet: "extras",
  },
  { id: "mint-glasses", name: "민트 안경", rect: [835, 115, 420, 140] },
  { id: "pink-star", name: "도트 별", rect: [40, 320, 355, 305] },
  { id: "dot-heart", name: "도트 하트", rect: [475, 335, 310, 275] },
  { id: "music", name: "파란 음표", rect: [935, 335, 255, 275] },
  { id: "bear", name: "젤리 곰", rect: [95, 635, 235, 295] },
  { id: "wings", name: "핑크 날개", rect: [415, 695, 425, 195] },
  { id: "chrome-star", name: "은색 별", rect: [875, 625, 370, 300] },
  { id: "burst", name: "민트 반짝임", rect: [70, 940, 330, 310] },
  { id: "love", name: "핑크 러브", rect: [440, 960, 345, 255] },
  { id: "bubble", name: "Good Vibes", rect: [800, 990, 450, 205] },
] as const;

export const stickerSheets = {
  original: { file: "stickers/y2k-atlas.png", width: 1280, height: 1280 },
  extras: { file: "stickers/y2k-extras.png", width: 1254, height: 1254 },
} as const;

export function getStickerSheet(id: StickerId) {
  const sticker = findSticker(id);
  return stickerSheets["sheet" in sticker ? sticker.sheet : "original"];
}

export type StickerId = (typeof stickerCatalog)[number]["id"];
export interface PlacedSticker {
  id: string;
  stickerId: StickerId;
  // 전체 네컷 스트립에 대한 정규화 좌표와 너비입니다.
  x: number;
  y: number;
  width: number;
  rotation: number;
}
export const findSticker = (id: StickerId) =>
  stickerCatalog.find((sticker) => sticker.id === id)!;

export function remainingSeconds(deadline: number | null, now: number) {
  return deadline === null
    ? DECORATE_SECONDS
    : Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function constrainSticker(sticker: PlacedSticker): PlacedSticker {
  const { rect } = findSticker(sticker.stickerId);
  const width = Math.min(0.7, Math.max(0.1, sticker.width));
  const height = (width * STRIP_WIDTH * rect[3]) / rect[2];
  const angle = (sticker.rotation * Math.PI) / 180;
  const halfX =
    (Math.abs(width * STRIP_WIDTH * Math.cos(angle)) +
      Math.abs(height * Math.sin(angle))) /
    (2 * STRIP_WIDTH);
  const halfY =
    (Math.abs(width * STRIP_WIDTH * Math.sin(angle)) +
      Math.abs(height * Math.cos(angle))) /
    (2 * STRIP_HEIGHT);
  return {
    ...sticker,
    width,
    x: Math.min(1 - halfX, Math.max(halfX, sticker.x)),
    y: Math.min(1 - halfY, Math.max(halfY, sticker.y)),
  };
}

export interface StickerSession {
  stickers: PlacedSticker[];
  deadline: number | null;
  open: boolean;
  selectedId: string | null;
}
export const emptyStickerSession: StickerSession = {
  stickers: [],
  deadline: null,
  open: false,
  selectedId: null,
};
export type StickerAction =
  | { type: "reset" }
  | { type: "open"; now: number }
  | { type: "close" }
  | { type: "select"; id: string }
  | { type: "add"; sticker: PlacedSticker; now: number }
  | {
      type: "update";
      id: string;
      patch: Partial<Pick<PlacedSticker, "x" | "y" | "width" | "rotation">>;
      now: number;
    }
  | { type: "remove"; id: string; now: number };

export function stickerReducer(
  state: StickerSession,
  action: StickerAction,
): StickerSession {
  if (action.type === "reset") return emptyStickerSession;
  if (action.type === "open")
    return {
      ...state,
      open: true,
      deadline: state.deadline ?? action.now + DECORATE_SECONDS * 1000,
    };
  if (action.type === "close") return { ...state, open: false };
  if (action.type === "select") return { ...state, selectedId: action.id };
  // 화면 갱신이 늦어져도 실제 조작 시각으로 편집 기한을 확인합니다.
  if (state.deadline === null || action.now >= state.deadline) return state;
  if (action.type === "add") {
    if (state.stickers.length >= MAX_STICKERS) return state;
    return {
      ...state,
      stickers: [...state.stickers, constrainSticker(action.sticker)],
      selectedId: action.sticker.id,
    };
  }
  if (action.type === "remove")
    return {
      ...state,
      stickers: state.stickers.filter((s) => s.id !== action.id),
      selectedId: null,
    };
  return {
    ...state,
    stickers: state.stickers.map((s) =>
      s.id === action.id ? constrainSticker({ ...s, ...action.patch }) : s,
    ),
  };
}
