import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyStickerSession,
  stickerReducer,
  remainingSeconds,
  MAX_STICKERS,
  constrainSticker,
  STRIP_WIDTH,
  STRIP_HEIGHT,
} from "../src/photo/stickers.ts";

const sticker = {
  id: "one",
  stickerId: "round-glasses",
  x: 0.5,
  y: 0.2,
  width: 0.34,
  rotation: 0,
};
const start = () =>
  stickerReducer(emptyStickerSession, { type: "open", now: 1000 });

test("편집창을 다시 열어도 180초 기한이 연장되지 않는다", () => {
  const first = start();
  assert.equal(first.deadline, 181000);
  const closed = stickerReducer(first, { type: "close" });
  assert.equal(
    stickerReducer(closed, { type: "open", now: 100000 }).deadline,
    181000,
  );
  assert.equal(remainingSeconds(first.deadline, 1000), 180);
  assert.equal(remainingSeconds(first.deadline, 180001), 1);
  assert.equal(remainingSeconds(first.deadline, 181000), 0);
  assert.equal(remainingSeconds(first.deadline, 900000), 0);
});

test("기한이 끝나는 순간 추가·이동·크기·삭제를 막고 결과는 유지한다", () => {
  const state = stickerReducer(start(), { type: "add", sticker, now: 2000 });
  for (const action of [
    { type: "add", sticker: { ...sticker, id: "two" } },
    { type: "update", id: "one", patch: { x: 0.8, width: 0.5, rotation: 45 } },
    { type: "remove", id: "one" },
  ])
    assert.deepEqual(stickerReducer(state, { ...action, now: 181000 }), state);
  assert.equal(
    stickerReducer(state, { type: "open", now: 999999 }).stickers.length,
    1,
  );
});

test("사진 밖으로 이동하거나 크게 회전해도 스티커가 잘리지 않게 제한한다", () => {
  for (const rotation of [0, 45, 90, 180]) {
    const bounded = constrainSticker({
      ...sticker,
      x: -10,
      y: 10,
      width: 1,
      rotation,
    });
    assert.equal(bounded.width, 0.7);
    const angle = (rotation * Math.PI) / 180;
    const width = bounded.width * STRIP_WIDTH,
      height = (width * 190) / 410;
    const halfX =
      (Math.abs(width * Math.cos(angle)) + Math.abs(height * Math.sin(angle))) /
      2;
    const halfY =
      (Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle))) /
      2;
    assert.ok(bounded.x * STRIP_WIDTH - halfX >= -0.001);
    assert.ok(bounded.y * STRIP_HEIGHT + halfY <= STRIP_HEIGHT + 0.001);
  }
});

test("최대 24개와 선택 삭제를 지원하고 새 촬영에서는 기한과 스티커를 초기화한다", () => {
  let state = start();
  for (let i = 0; i < MAX_STICKERS + 2; i++)
    state = stickerReducer(state, {
      type: "add",
      sticker: { ...sticker, id: String(i) },
      now: 2000,
    });
  assert.equal(state.stickers.length, MAX_STICKERS);
  state = stickerReducer(state, { type: "remove", id: "0", now: 3000 });
  assert.equal(state.stickers.length, MAX_STICKERS - 1);
  assert.equal(
    state.stickers.some((s) => s.id === "0"),
    false,
  );
  assert.deepEqual(
    stickerReducer(state, { type: "reset" }),
    emptyStickerSession,
  );
});
