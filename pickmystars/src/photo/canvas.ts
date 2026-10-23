import { filterPixels, type PhotoFilterId } from "./filters.ts";
import {
  findSticker,
  getStickerSheet,
  STRIP_WIDTH,
  STRIP_HEIGHT,
  type PlacedSticker,
} from "./stickers.ts";
import { coverRect } from "./capture.ts";

export async function loadImage(source: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = source;
  await image.decode();
  return image;
}

function drawCover(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  width: number,
  height: number,
  mirror = false,
  alignY = 0.5,
) {
  const crop = coverRect(sw, sh, width, height, alignY);
  context.save();
  if (mirror) {
    context.translate(x + width, y);
    context.scale(-1, 1);
  }
  context.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    mirror ? 0 : x,
    mirror ? 0 : y,
    width,
    height,
  );
  context.restore();
}

export function captureSolo(video: HTMLVideoElement): string {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    throw new Error("카메라가 준비되지 않았습니다. 잠시 후 다시 촬영해주세요.");
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("사진을 만들 수 없습니다.");
  drawCover(
    context,
    video,
    video.videoWidth,
    video.videoHeight,
    0,
    0,
    1200,
    800,
    true,
  );
  return canvas.toDataURL("image/jpeg", 0.94);
}

export async function createPhotoStrip(
  shots: string[],
  color: string,
  stickers: PlacedSticker[] = [],
  filter: PhotoFilterId = "original",
): Promise<Blob> {
  if (shots.length !== 4) throw new Error("네 장의 촬영을 완료해주세요.");
  const images = await Promise.all(shots.map(loadImage));
  const canvas = document.createElement("canvas");
  canvas.width = STRIP_WIDTH;
  canvas.height = STRIP_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("사진을 저장할 수 없습니다.");
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#513e49";
  context.font = "bold 30px sans-serif";
  context.textAlign = "center";
  context.fillText("P!ck My St☆r", 640, 47);
  // 사진만 보정하고 프레임·문구·스티커의 원래 색은 유지합니다.
  const photoCanvas =
    filter === "original" ? null : document.createElement("canvas");
  if (photoCanvas) {
    photoCanvas.width = 1200;
    photoCanvas.height = 800;
  }
  const photoContext = photoCanvas?.getContext("2d", {
    willReadFrequently: true,
  });
  if (photoCanvas && !photoContext)
    throw new Error("필터를 적용할 수 없습니다.");
  images.forEach((image, index) => {
    if (photoCanvas && photoContext) {
      photoContext.clearRect(0, 0, 1200, 800);
      photoContext.drawImage(image, 0, 0, 1200, 800);
      const pixels = photoContext.getImageData(0, 0, 1200, 800);
      filterPixels(pixels.data, filter);
      photoContext.putImageData(pixels, 0, 0);
    }
    context.drawImage(photoCanvas ?? image, 40, 72 + index * 824, 1200, 800);
  });
  context.font = "28px sans-serif";
  context.fillText(
    "2026 청아즐 - 미림마이스터고 MSG",
    640,
    canvas.height - 36,
    1160,
  );
  if (stickers.length) {
    const files = [
      ...new Set(
        stickers.map((sticker) => getStickerSheet(sticker.stickerId).file),
      ),
    ];
    const atlases = new Map(
      await Promise.all(
        files.map(
          async (file) =>
            [
              file,
              await loadImage(
                `${import.meta.env?.BASE_URL ?? "/"}assets/${file}`,
              ),
            ] as const,
        ),
      ),
    );
    for (const sticker of stickers) {
      const { rect } = findSticker(sticker.stickerId);
      const width = sticker.width * STRIP_WIDTH;
      const height = (width * rect[3]) / rect[2];
      context.save();
      context.translate(sticker.x * STRIP_WIDTH, sticker.y * STRIP_HEIGHT);
      context.rotate((sticker.rotation * Math.PI) / 180);
      context.drawImage(
        atlases.get(getStickerSheet(sticker.stickerId).file)!,
        rect[0],
        rect[1],
        rect[2],
        rect[3],
        -width / 2,
        -height / 2,
        width,
        height,
      );
      context.restore();
    }
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지 저장에 실패했습니다."));
    }, "image/png"),
  );
}
