import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { asset } from "../data/idols";
import { createPhotoStrip } from "../photo/canvas";
import {
  findSticker,
  getStickerSheet,
  MAX_STICKERS,
  stickerCatalog,
  STRIP_HEIGHT,
  STRIP_WIDTH,
  type PlacedSticker,
  type StickerAction,
  type StickerId,
  type StickerSession,
} from "../photo/stickers";

export function StickerGraphic({ stickerId }: { stickerId: StickerId }) {
  const [x, y, width, height] = findSticker(stickerId).rect;
  const sheet = getStickerSheet(stickerId);
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      <image
        href={asset(sheet.file)}
        width={sheet.width}
        height={sheet.height}
      />
    </svg>
  );
}

export function StickerOverlay({ stickers }: { stickers: PlacedSticker[] }) {
  return (
    <div className="sticker-overlay" aria-hidden="true">
      {stickers.map((sticker) => {
        const definition = findSticker(sticker.stickerId);
        return (
          <div
            key={sticker.id}
            className="placed-sticker"
            style={{
              left: `${sticker.x * 100}%`,
              top: `${sticker.y * 100}%`,
              width: `${sticker.width * 100}%`,
              aspectRatio: `${definition.rect[2]} / ${definition.rect[3]}`,
              transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
            }}
          >
            <StickerGraphic stickerId={sticker.stickerId} />
          </div>
        );
      })}
    </div>
  );
}

interface EditorProps {
  shots: string[];
  frame: string;
  state: StickerSession;
  dispatch: Dispatch<StickerAction>;
  seconds: number;
  expired: boolean;
  onClose: () => void;
}

export function StickerEditor({
  shots,
  frame,
  state,
  dispatch,
  seconds,
  expired,
  onClose,
}: EditorProps) {
  const [base, setBase] = useState("");
  const [error, setError] = useState("");
  const surface = useRef<HTMLDivElement>(null);
  const finish = useRef<HTMLButtonElement>(null);
  const drag = useRef<{
    id: string;
    clientX: number;
    clientY: number;
    x: number;
    y: number;
  } | null>(null);
  const selected = state.stickers.find((s) => s.id === state.selectedId);

  useEffect(() => {
    let live = true;
    let url: string | undefined;
    createPhotoStrip(shots, frame)
      .then((blob) => {
        if (live) {
          url = URL.createObjectURL(blob);
          setBase(url);
        }
      })
      .catch(() => {
        if (live)
          setError("사진을 준비하지 못했어요. 닫았다가 다시 열어주세요.");
      });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [shots, frame]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const root = document.getElementById("root");
    const wasInert = root?.inert ?? false;
    if (root) root.inert = true;
    document.body.style.overflow = "hidden";
    finish.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (root) root.inert = wasInert;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (expired) {
      drag.current = null;
      finish.current?.focus();
    }
  }, [expired]);

  const update = (
    patch: Partial<Pick<PlacedSticker, "x" | "y" | "width" | "rotation">>,
  ) => {
    if (selected)
      dispatch({ type: "update", id: selected.id, patch, now: Date.now() });
  };
  const beginDrag = (
    event: PointerEvent<HTMLButtonElement>,
    sticker: PlacedSticker,
  ) => {
    if (expired) return;
    event.preventDefault();
    dispatch({ type: "select", id: sticker.id });
    drag.current = {
      id: sticker.id,
      clientX: event.clientX,
      clientY: event.clientY,
      x: sticker.x,
      y: sticker.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    const bounds = surface.current?.getBoundingClientRect();
    if (!current || !bounds || expired) return;
    dispatch({
      type: "update",
      id: current.id,
      patch: {
        x: current.x + (event.clientX - current.clientX) / bounds.width,
        y: current.y + (event.clientY - current.clientY) / bounds.height,
      },
      now: Date.now(),
    });
  };

  return createPortal(
    <div
      className="sticker-editor-backdrop"
      onKeyDown={(event) => {
        // 배경 화면의 ESC 홈 이동 대신 편집창만 닫습니다.
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
        if (event.key === "Tab") {
          const items = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input:not(:disabled)",
            ),
          );
          const first = items[0],
            last = items.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <section
        className="sticker-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sticker-editor-title"
      >
        <header className="sticker-editor-heading">
          <div>
            <h2 id="sticker-editor-title">나만의 네컷 꾸미기</h2>
            <p>
              {expired
                ? "꾸미기 시간이 끝났어요. 완성 사진을 이메일로 받아보세요."
                : "스티커를 골라 사진 위로 옮겨보세요. 편집창을 닫아도 시간은 계속 흘러요."}
            </p>
          </div>
          <output
            className={seconds <= 30 ? "sticker-clock urgent" : "sticker-clock"}
            aria-label="꾸미기 남은 시간"
          >
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
          </output>
          <button ref={finish} className="sticker-finish" onClick={onClose}>
            꾸미기 완료
          </button>
        </header>
        {expired && (
          <p className="sticker-expired" role="status">
            180초가 지나 편집이 잠겼어요. 붙인 스티커는 그대로 유지됩니다.
          </p>
        )}
        <div className="sticker-editor-body">
          <div className="sticker-canvas-scroll">
            {error ? (
              <p role="alert">{error}</p>
            ) : !base ? (
              <p role="status">사진을 준비하고 있어요…</p>
            ) : (
              <div
                className="sticker-canvas"
                ref={surface}
                style={{ aspectRatio: `${STRIP_WIDTH} / ${STRIP_HEIGHT}` }}
              >
                <img src={base} alt="꾸미는 네컷 사진" draggable={false} />
                {state.stickers.map((sticker) => {
                  const definition = findSticker(sticker.stickerId);
                  return (
                    <button
                      key={sticker.id}
                      aria-label={`${definition.name} 스티커 선택`}
                      aria-pressed={selected?.id === sticker.id}
                      disabled={expired}
                      className="placed-sticker sticker-handle"
                      style={{
                        left: `${sticker.x * 100}%`,
                        top: `${sticker.y * 100}%`,
                        width: `${sticker.width * 100}%`,
                        aspectRatio: `${definition.rect[2]} / ${definition.rect[3]}`,
                        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                      }}
                      onPointerDown={(event) => beginDrag(event, sticker)}
                      onPointerMove={move}
                      onPointerUp={() => {
                        drag.current = null;
                      }}
                      onPointerCancel={() => {
                        drag.current = null;
                      }}
                      onLostPointerCapture={() => {
                        drag.current = null;
                      }}
                      onClick={() =>
                        dispatch({ type: "select", id: sticker.id })
                      }
                      onKeyDown={(event) => {
                        if (expired) return;
                        const offsets: Record<string, [number, number]> = {
                          ArrowLeft: [-0.01, 0],
                          ArrowRight: [0.01, 0],
                          ArrowUp: [0, -0.005],
                          ArrowDown: [0, 0.005],
                        };
                        const offset = offsets[event.key];
                        if (offset) {
                          event.preventDefault();
                          dispatch({
                            type: "update",
                            id: sticker.id,
                            patch: {
                              x: sticker.x + offset[0],
                              y: sticker.y + offset[1],
                            },
                            now: Date.now(),
                          });
                        }
                      }}
                    >
                      <StickerGraphic stickerId={sticker.stickerId} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <aside className="sticker-tools">
            <h3>
              스티커{" "}
              <small>
                {state.stickers.length} / {MAX_STICKERS}
              </small>
            </h3>
            <div className="sticker-palette">
              {stickerCatalog.map((sticker) => (
                <button
                  key={sticker.id}
                  disabled={
                    expired || !base || state.stickers.length >= MAX_STICKERS
                  }
                  aria-label={`${sticker.name} 추가`}
                  title={sticker.name}
                  onClick={() =>
                    dispatch({
                      type: "add",
                      now: Date.now(),
                      sticker: {
                        id: crypto.randomUUID(),
                        stickerId: sticker.id,
                        x: 0.5,
                        y: 0.5,
                        width: 0.34,
                        rotation: 0,
                      },
                    })
                  }
                >
                  <StickerGraphic stickerId={sticker.id} />
                </button>
              ))}
            </div>
            <p className="sticker-hint">
              사진 위 스티커를 끌어서 옮겨보세요. 선택한 스티커는 방향키로도
              이동할 수 있어요.
            </p>
            <fieldset
              disabled={expired || !selected}
              className="sticker-adjustments"
            >
              <legend>선택한 스티커 조절</legend>
              <label>
                크기
                <input
                  aria-label="스티커 크기"
                  type="range"
                  min="10"
                  max="70"
                  value={Math.round((selected?.width ?? 0.34) * 100)}
                  onChange={(event) =>
                    update({ width: Number(event.target.value) / 100 })
                  }
                />
              </label>
              <label>
                회전
                <input
                  aria-label="스티커 회전"
                  type="range"
                  min="-180"
                  max="180"
                  value={selected?.rotation ?? 0}
                  onChange={(event) =>
                    update({ rotation: Number(event.target.value) })
                  }
                />
              </label>
              <button
                className="sticker-delete"
                onClick={() => {
                  if (selected)
                    dispatch({
                      type: "remove",
                      id: selected.id,
                      now: Date.now(),
                    });
                }}
              >
                선택한 스티커 삭제
              </button>
            </fieldset>
          </aside>
        </div>
      </section>
    </div>,
    document.body,
  );
}
