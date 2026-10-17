export function coverRect(
  sw: number,
  sh: number,
  dw: number,
  dh: number,
  alignY = 0.5,
) {
  if ([sw, sh, dw, dh].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("사진 크기를 확인할 수 없습니다.");
  }
  const scale = Math.max(dw / sw, dh / sh);
  const width = dw / scale;
  const height = dh / scale;
  return { x: (sw - width) / 2, y: (sh - height) * alignY, width, height };
}

export function abortableDelay(
  milliseconds: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("취소됨", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function captureSequence<T>(options: {
  seconds: number;
  signal: AbortSignal;
  onCountdown: (value: number | null) => void;
  capture: (index: number) => T;
  onShot: (shot: T) => void;
  delay?: typeof abortableDelay;
}) {
  const {
    seconds,
    signal,
    onCountdown,
    capture,
    onShot,
    delay = abortableDelay,
  } = options;
  for (let index = 0; index < 4; index++) {
    for (let count = seconds; count > 0; count--) {
      signal.throwIfAborted();
      onCountdown(count);
      await delay(1000, signal);
    }
    signal.throwIfAborted();
    onCountdown(null);
    onShot(capture(index));
    if (index < 3) await delay(450, signal);
  }
}
