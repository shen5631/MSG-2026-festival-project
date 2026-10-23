export const photoFilters = [
  { id: "original", name: "기본", css: "none" },
  {
    id: "soft",
    name: "뽀얗게",
    css: "brightness(1.08) contrast(0.94) saturate(0.9)",
  },
  {
    id: "warm",
    name: "따뜻하게",
    css: "sepia(0.18) saturate(1.12) brightness(1.04)",
  },
  { id: "mono", name: "흑백", css: "grayscale(1) contrast(1.05)" },
] as const;

export type PhotoFilterId = (typeof photoFilters)[number]["id"];
export const getPhotoFilter = (id: PhotoFilterId) =>
  photoFilters.find((filter) => filter.id === id)!;

// CSS 필터와 같은 순서·계수로 처리해 Canvas filter 미지원 브라우저에서도 저장합니다.
// RGB만 바꾸므로 투명도는 유지됩니다.
export function filterPixels(data: Uint8ClampedArray, filter: PhotoFilterId) {
  if (filter === "original") return;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    if (filter === "soft") {
      r = Math.min(255, r * 1.08) * 0.94 + 255 * 0.03;
      g = Math.min(255, g * 1.08) * 0.94 + 255 * 0.03;
      b = Math.min(255, b * 1.08) * 0.94 + 255 * 0.03;
      const gray = r * 0.213 + g * 0.715 + b * 0.072;
      r = gray + (r - gray) * 0.9;
      g = gray + (g - gray) * 0.9;
      b = gray + (b - gray) * 0.9;
    } else if (filter === "warm") {
      const sr = Math.min(255, r * 0.89074 + g * 0.13842 + b * 0.03402);
      const sg = Math.min(255, r * 0.06282 + g * 0.94348 + b * 0.03024);
      const sb = Math.min(255, r * 0.04896 + g * 0.09612 + b * 0.84358);
      const gray = sr * 0.213 + sg * 0.715 + sb * 0.072;
      r = Math.max(0, Math.min(255, gray + (sr - gray) * 1.12)) * 1.04;
      g = Math.max(0, Math.min(255, gray + (sg - gray) * 1.12)) * 1.04;
      b = Math.max(0, Math.min(255, gray + (sb - gray) * 1.12)) * 1.04;
    } else {
      const gray = r * 0.2126 + g * 0.7152 + b * 0.0722;
      r = g = b = gray * 1.05 - 255 * 0.025;
    }
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}
