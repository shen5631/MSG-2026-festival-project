// 개발 서버용 수동 통합 테스트. 실제 웹캠을 사용하지 않습니다.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PhotoPage } from "../src/pages/PhotoPage";
import { GameContext, type GameContextValue } from "../src/state/GameContext";
import { idols, type ScreenId } from "../src/data/idols";
import "../src/styles/app.css";
const source = document.createElement("canvas");
source.width = 1280;
source.height = 720;
const context = source.getContext("2d")!;
let count = 0;
function paint() {
  context.fillStyle = "#dfebfa";
  context.fillRect(0, 0, 1280, 720);
  context.fillStyle = "#e86993";
  context.fillRect(0, 0, 280, 720);
  context.fillStyle = "#365c97";
  context.fillRect(1000, 0, 280, 720);
  context.fillStyle = "#314d70";
  context.font = "bold 65px sans-serif";
  context.fillText("TEST CAMERA", 340, 300);
  context.font = "45px sans-serif";
  context.fillText(String(count++), 560, 400);
  requestAnimationFrame(paint);
}
paint();
let track: MediaStreamTrack | undefined;
let calls = 0;
let resolvePending: ((stream: MediaStream) => void) | undefined;
const mode = new URLSearchParams(location.search).get("mode");
function stream() {
  const value = source.captureStream(12);
  track = value.getVideoTracks()[0];
  return value;
}
Object.defineProperty(navigator, "mediaDevices", {
  configurable: true,
  value: {
    getUserMedia: async (constraints: MediaStreamConstraints) => {
      if (constraints.audio !== false)
        throw new Error("마이크가 요청됐습니다.");
      calls++;
      if (mode === "denied")
        throw new DOMException("test denied", "NotAllowedError");
      if (mode === "missing")
        throw new DOMException("test missing", "NotFoundError");
      if (mode === "pending")
        return new Promise<MediaStream>((resolve) => {
          resolvePending = resolve;
        });
      return stream();
    },
  },
});
function Harness() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("photo");
  const [report, setReport] = useState("");
  const winner = idols.boy[1];
  const value = {
    category: "boy",
    winner,
    activeScreen,
    navigate: setActiveScreen,
  } as GameContextValue;
  return (
    <>
      <div
        style={{
          background: "white",
          padding: 8,
          position: "relative",
          zIndex: 10,
          display: "flex",
          gap: 10,
        }}
      >
        <button onClick={() => setActiveScreen("photo")}>
          테스트: 부스로 입장
        </button>
        <button onClick={() => setActiveScreen("result")}>
          테스트: 부스에서 나가기
        </button>
        <button
          onClick={() =>
            setReport(`호출 ${calls} · 카메라 ${track?.readyState ?? "없음"}`)
          }
        >
          테스트: 카메라 상태 확인
        </button>
        <button onClick={() => resolvePending?.(stream())}>
          테스트: 늦은 권한 허용
        </button>
        <output>{report}</output>
      </div>
      <GameContext.Provider value={value}>
        <main id="stage" data-theme="boy">
          <div className="design-canvas">
            <PhotoPage />
          </div>
        </main>
      </GameContext.Provider>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
