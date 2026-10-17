import test from "node:test";
import assert from "node:assert/strict";
import {
  coverRect,
  captureSequence,
  abortableDelay,
} from "../src/photo/capture.ts";

for (const seconds of [3, 5, 10]) {
  test(`${seconds}초 타이머로 중복 없이 네 장을 순서대로 촬영`, async () => {
    const counts = [],
      shots = [],
      delays = [];
    await captureSequence({
      seconds,
      signal: new AbortController().signal,
      onCountdown: (value) => counts.push(value),
      capture: (index) => `shot-${index}`,
      onShot: (shot) => shots.push(shot),
      delay: async (ms) => {
        delays.push(ms);
      },
    });
    assert.deepEqual(shots, ["shot-0", "shot-1", "shot-2", "shot-3"]);
    assert.equal(delays.filter((ms) => ms === 1000).length, 4 * seconds);
    assert.equal(delays.filter((ms) => ms === 450).length, 3);
    assert.equal(counts.filter((x) => x === null).length, 4);
    assert.deepEqual(
      counts.slice(0, seconds),
      Array.from({ length: seconds }, (_, i) => seconds - i),
    );
  });
}
test("촬영 중 취소하면 다음 사진이 만들어지지 않는다", async () => {
  const controller = new AbortController();
  const shots = [];
  await assert.rejects(
    captureSequence({
      seconds: 3,
      signal: controller.signal,
      onCountdown: () => {},
      capture: (index) => index,
      onShot: (shot) => {
        shots.push(shot);
        controller.abort();
      },
      delay: async () => {},
    }),
    { name: "AbortError" },
  );
  assert.deepEqual(shots, [0]);
});
test("이미 취소된 타이머는 즉시 종료한다", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(abortableDelay(10000, controller.signal), {
    name: "AbortError",
  });
});
test("촬영 오류는 중단되고 뒤의 사진을 만들지 않는다", async () => {
  let captures = 0;
  await assert.rejects(
    captureSequence({
      seconds: 3,
      signal: new AbortController().signal,
      onCountdown: () => {},
      capture: () => {
        captures++;
        throw new Error("camera stopped");
      },
      onShot: () => {},
      delay: async () => {},
    }),
    /camera stopped/,
  );
  assert.equal(captures, 1);
});
test("카메라와 인물 사진은 비율을 늘리지 않고 cover 크롭한다", () => {
  const wide = coverRect(1280, 720, 600, 800);
  assert.equal(wide.height, 720);
  assert.equal(wide.width, 540);
  assert.equal(wide.x, 370);
  const tall = coverRect(1200, 1600, 600, 800);
  assert.deepEqual(tall, { x: 0, y: 0, width: 1200, height: 1600 });
  assert.throws(() => coverRect(0, 720, 600, 800));
});
