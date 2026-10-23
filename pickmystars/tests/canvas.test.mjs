import test from "node:test";
import assert from "node:assert/strict";
import { captureSolo } from "../src/photo/canvas.ts";

test("개인 촬영은 카메라만 전체 1200×800에 거울 방향으로 그린다", () => {
  const calls = [];
  const context = {
    save() {},
    restore() {},
    translate: (...args) => calls.push(["translate", ...args]),
    scale: (...args) => calls.push(["scale", ...args]),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toDataURL: () => "data:image/jpeg;base64,test",
  };
  const original = globalThis.document;
  globalThis.document = { createElement: () => canvas };
  try {
    const video = { readyState: 2, videoWidth: 1280, videoHeight: 720 };
    assert.equal(captureSolo(video), "data:image/jpeg;base64,test");
    assert.equal(canvas.width, 1200);
    assert.equal(canvas.height, 800);
    const draws = calls.filter(([name]) => name === "drawImage");
    assert.equal(draws.length, 1);
    assert.equal(draws[0][1], video);
    assert.deepEqual(draws[0].slice(-4), [0, 0, 1200, 800]);
    assert.deepEqual(
      calls.find(([name]) => name === "scale"),
      ["scale", -1, 1],
    );
  } finally {
    globalThis.document = original;
  }
});

test("준비되지 않은 카메라는 빈 사진을 만들지 않는다", () => {
  assert.throws(
    () => captureSolo({ readyState: 1, videoWidth: 0, videoHeight: 0 }),
    /카메라가 준비되지/,
  );
});
