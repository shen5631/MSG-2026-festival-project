// 개발 서버 전용: 추가 스티커의 선택·편집과 실제 PNG 출력을 확인합니다.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { StickerEditor } from "../src/components/StickerEditor";
import { useStickerSession } from "../src/hooks/useStickerSession";
import { createPhotoStrip } from "../src/photo/canvas";
import { stickerCatalog } from "../src/photo/stickers";
import "../src/styles/app.css";

const shot = document.createElement("canvas");
shot.width = 1200;
shot.height = 800;
const ctx = shot.getContext("2d")!;
ctx.fillStyle = "#bdddf2";
ctx.fillRect(0, 0, 1200, 800);
const shots = Array(4).fill(shot.toDataURL());
function Harness() {
  const decoration = useStickerSession(shots[0], true);
  const [output, setOutput] = useState("");
  const [report, setReport] = useState("PNG 준비 중…");
  useEffect(() => {
    let active = true;
    let url: string | undefined;
    const additions = stickerCatalog.slice(-6).map((sticker, index) => ({
      id: String(index),
      stickerId: sticker.id,
      x: index % 2 === 0 ? 0.27 : 0.73,
      y: 0.18 + Math.floor(index / 2) * 0.28,
      width: 0.38,
      rotation: 0,
    }));
    createPhotoStrip(shots, "#f0bad3", additions)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setOutput(url);
        setReport(
          `통과: 새 스티커 ${additions.length}종 PNG 합성 · 전체 ${stickerCatalog.length}종`,
        );
      })
      .catch((error) => {
        if (active) setReport(`실패: ${error.message}`);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);
  return (
    <main style={{ padding: 24 }}>
      <h1>추가 스티커 확인</h1>
      <p role="status">{report}</p>
      <button onClick={decoration.open}>스티커 편집 테스트</button>
      {output && (
        <img
          src={output}
          alt="새 스티커 6종 저장 결과"
          style={{ display: "block", width: 260, marginTop: 20 }}
        />
      )}
      {decoration.state.open && (
        <StickerEditor
          shots={shots}
          frame="#f0bad3"
          filter="original"
          state={decoration.state}
          dispatch={decoration.dispatch}
          seconds={decoration.seconds}
          expired={decoration.expired}
          onClose={decoration.close}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
