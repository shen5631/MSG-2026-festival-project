import { coverRect } from "./capture";

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

export function capturePair(
  video: HTMLVideoElement,
  idol: HTMLImageElement,
): string {
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
    600,
    800,
    true,
  );
  drawCover(
    context,
    idol,
    idol.naturalWidth,
    idol.naturalHeight,
    600,
    0,
    600,
    800,
    false,
    0.25,
  );
  return canvas.toDataURL("image/jpeg", 0.94);
}

export async function createPhotoStrip(
  shots: string[],
  color: string,
  name: string,
): Promise<Blob> {
  if (shots.length !== 4) throw new Error("네 장의 촬영을 완료해주세요.");
  const images = await Promise.all(shots.map(loadImage));
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 72 + 4 * 800 + 3 * 24 + 90;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("사진을 저장할 수 없습니다.");
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#513e49";
  context.font = "bold 30px sans-serif";
  context.textAlign = "center";
  context.fillText("P!ck My St☆r", 640, 47);
  images.forEach((image, index) =>
    context.drawImage(image, 40, 72 + index * 824, 1200, 800),
  );
  context.font = "28px sans-serif";
  context.fillText(name + " · 함께 남기는 네컷", 640, canvas.height - 36, 1160);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지 저장에 실패했습니다."));
    }, "image/png"),
  );
}
