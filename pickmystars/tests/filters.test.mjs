import test from "node:test";
import assert from "node:assert/strict";
import { filterPixels } from "../src/photo/filters.ts";

test("기본 필터는 원본 픽셀을 그대로 유지한다", () => {
  const data = new Uint8ClampedArray([20, 120, 240, 128]);
  filterPixels(data, "original");
  assert.deepEqual([...data], [20, 120, 240, 128]);
});
test("흑백은 색을 없애고 모든 필터는 투명도를 유지한다", () => {
  for (const filter of ["soft", "warm", "mono"]) {
    const data = new Uint8ClampedArray([80, 120, 180, 128]);
    filterPixels(data, filter);
    assert.equal(data[3], 128);
    if (filter === "mono")
      assert.ok(data[0] === data[1] && data[1] === data[2]);
    else assert.notDeepEqual([...data], [80, 120, 180, 128]);
  }
});
test("따뜻한 필터는 중성 회색에 따뜻한 색을 더한다", () => {
  const data = new Uint8ClampedArray([120, 120, 120, 255]);
  filterPixels(data, "warm");
  assert.ok(data[0] > data[1] && data[1] > data[2]);
});
