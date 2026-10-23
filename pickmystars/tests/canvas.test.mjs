import test from "node:test";
import assert from "node:assert/strict";
import { captureSolo, createPhotoStrip } from "../src/photo/canvas.ts";

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

test("이메일용 네컷에 스티커를 미리보기와 같은 좌표·크기·회전으로 합성한다", async () => {
  const calls = [];
  const context = {
    save() {},
    restore() {},
    fillRect() {},
    fillText() {},
    translate: (...args) => calls.push(["translate", ...args]),
    rotate: (...args) => calls.push(["rotate", ...args]),
    drawImage: (...args) => calls.push(["drawImage", ...args]),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => context,
    toBlob: (callback) => callback(new Blob(["test"], { type: "image/png" })),
  };
  const originalDocument = globalThis.document,
    originalImage = globalThis.Image;
  globalThis.document = { createElement: () => canvas };
  globalThis.Image = class {
    async decode() {}
  };
  try {
    const blob = await createPhotoStrip(
      ["shot1", "shot2", "shot3", "shot4"],
      "#f0bad3",
      [
        {
          id: "one",
          stickerId: "round-glasses",
          x: 0.5,
          y: 0.25,
          width: 0.3,
          rotation: 90,
        },
        {
          id: "two",
          stickerId: "kitty-glasses",
          x: 0.5,
          y: 0.5,
          width: 0.3,
          rotation: 0,
        },
        {
          id: "three",
          stickerId: "dot-bow",
          x: 0.5,
          y: 0.7,
          width: 0.3,
          rotation: 0,
        },
      ],
    );
    assert.equal(blob.type, "image/png");
    const draws = calls.filter(([name]) => name === "drawImage");
    assert.equal(draws.length, 7);
    assert.equal(draws[5][1].src, "/assets/stickers/y2k-extras.png");
    assert.equal(draws[5][1], draws[6][1]);
    assert.deepEqual(draws[5].slice(2, 6), [20, 210, 595, 295]);
    assert.equal(draws[4][1].src, "/assets/stickers/y2k-atlas.png");
    assert.deepEqual(draws[4].slice(2, 6), [20, 75, 410, 190]);
    assert.deepEqual(
      calls.find(([name]) => name === "translate"),
      ["translate", 640, 858.5],
    );
    assert.equal(calls.find(([name]) => name === "rotate")[1], Math.PI / 2);
    assert.equal(draws[4].at(-2), 384);
    assert.equal(canvas.width, 1280);
    assert.equal(canvas.height, 3434);
  } finally {
    globalThis.document = originalDocument;
    globalThis.Image = originalImage;
  }
});
