// 개발 서버 전용: 실제 Canvas 합성에서 사진 보정과 프레임·스티커 색 보존을 검사합니다.
import { createPhotoStrip, loadImage } from "../src/photo/canvas";
import { photoFilters } from "../src/photo/filters";

async function verify() {
  const shot = document.createElement("canvas");
  shot.width = 1200;
  shot.height = 800;
  const context = shot.getContext("2d")!;
  context.fillStyle = "rgb(80, 120, 180)";
  context.fillRect(0, 0, 1200, 800);
  const shots = Array(4).fill(shot.toDataURL());
  const stickers = [
    {
      id: "pink",
      stickerId: "kitty-glasses" as const,
      x: 0.5,
      y: 0.7,
      width: 0.4,
      rotation: 0,
    },
  ];
  const results = [];
  for (const filter of photoFilters) {
    const blob = await createPhotoStrip(shots, "#f0bad3", stickers, filter.id);
    const url = URL.createObjectURL(blob);
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const pixel = (x: number, y: number) => [
      ...ctx.getImageData(x, y, 1, 1).data,
    ];
    const frame = pixel(10, 100);
    if (frame.join() !== "240,186,211,255")
      throw new Error("프레임 색이 변경됨");
    results.push({ id: filter.id, photo: pixel(100, 100), ctx });
    const card = document.createElement("figure");
    card.innerHTML = `<figcaption>${filter.name}</figcaption><img src="${url}" alt="${filter.name} 저장 결과" width="160"/>`;
    document.getElementById("root")!.append(card);
  }
  const mono = results.find((r) => r.id === "mono")!.photo;
  if (mono[0] !== mono[1] || mono[1] !== mono[2])
    throw new Error("흑백 저장 실패");
  const mask = document.createElement("canvas");
  mask.width = 1280;
  mask.height = 3434;
  const maskCtx = mask.getContext("2d")!;
  const atlas = await loadImage("/assets/stickers/y2k-extras.png");
  const stickerHeight = (512 * 295) / 595;
  maskCtx.drawImage(
    atlas,
    20,
    210,
    595,
    295,
    384,
    0.7 * 3434 - stickerHeight / 2,
    512,
    stickerHeight,
  );
  const alpha = maskCtx.getImageData(420, 2240, 440, 320).data;
  const original = results[0].ctx.getImageData(420, 2240, 440, 320).data;
  for (const result of results.slice(1)) {
    const current = result.ctx.getImageData(420, 2240, 440, 320).data;
    let colored = 0;
    for (let i = 0; i < original.length; i += 4) {
      // 거의 불투명한 핑크 영역을 비교합니다. 반투명도·합성 반올림 오차(4)는 허용합니다.
      if (
        alpha[i + 3] >= 250 &&
        original[i] > 180 &&
        original[i] - original[i + 1] > 20
      ) {
        if (
          Math.abs(original[i] - current[i]) > 4 ||
          Math.abs(original[i + 1] - current[i + 1]) > 4 ||
          Math.abs(original[i + 2] - current[i + 2]) > 4
        )
          throw new Error(
            `스티커 색이 변경됨: ${result.id} ${i} alpha=${alpha[i + 3]} ${original.slice(i, i + 4)} / ${current.slice(i, i + 4)}`,
          );
        colored++;
      }
    }
    if (colored < 100) throw new Error("스티커 확인 영역 오류");
  }
  const output = document.createElement("output");
  output.textContent =
    "통과: 4종 PNG 저장 · 흑백 적용 · 프레임과 스티커 색 유지";
  document.body.prepend(output);
}
verify().catch((error) => {
  document.body.prepend(`실패: ${error.message}`);
});
