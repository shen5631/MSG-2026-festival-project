// 개발 서버 전용: 실제 PNG 출력과 스티커 투명 영역을 브라우저에서 확인합니다.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPhotoStrip, loadImage } from "../src/photo/canvas";

function OutputHarness() {
  const [source, setSource] = useState("");
  const [report, setReport] = useState("출력을 확인하는 중…");
  useEffect(() => {
    let live = true;
    let url: string | undefined;
    async function verify() {
      const shot = document.createElement("canvas");
      shot.width = 1200;
      shot.height = 800;
      const ctx = shot.getContext("2d")!;
      ctx.fillStyle = "#dbefff";
      ctx.fillRect(0, 0, 1200, 800);
      const shots = Array(4).fill(shot.toDataURL());
      const base = await createPhotoStrip(shots, "#f0bad3");
      const decorated = await createPhotoStrip(shots, "#f0bad3", [
        {
          id: "glasses",
          stickerId: "kitty-glasses",
          x: 0.5,
          y: 0.14,
          width: 0.5,
          rotation: 0,
        },
        {
          id: "star",
          stickerId: "black-star",
          x: 0.5,
          y: 0.4,
          width: 0.4,
          rotation: 20,
        },
        {
          id: "bow",
          stickerId: "dot-bow",
          x: 0.5,
          y: 0.7,
          width: 0.4,
          rotation: -15,
        },
      ]);
      const baseUrl = URL.createObjectURL(base),
        decoratedUrl = URL.createObjectURL(decorated);
      try {
        const [a, b] = await Promise.all([
          loadImage(baseUrl),
          loadImage(decoratedUrl),
          {
            id: "bow",
            stickerId: "dot-bow",
            x: 0.5,
            y: 0.7,
            width: 0.4,
            rotation: -15,
          },
        ]);
        const compare = document.createElement("canvas");
        compare.width = a.naturalWidth;
        compare.height = a.naturalHeight;
        const context = compare.getContext("2d")!;
        context.drawImage(a, 0, 0);
        const before = context.getImageData(0, 0, 1280, 3434).data;
        context.clearRect(0, 0, 1280, 3434);
        context.drawImage(b, 0, 0);
        const after = context.getImageData(0, 0, 1280, 3434).data;
        let changed = 0;
        for (let i = 0; i < before.length; i += 4)
          if (
            before[i] !== after[i] ||
            before[i + 1] !== after[i + 1] ||
            before[i + 2] !== after[i + 2]
          )
            changed++;
        if (changed < 1000)
          throw new Error("스티커가 PNG에 반영되지 않았습니다.");
        // 비어 있는 안경 렌즈 안쪽은 원래 사진 색을 유지해야 합니다.
        const index = (Math.round(0.14 * 3434) * 1280 + 476) * 4;
        if (
          before[index] !== after[index] ||
          before[index + 1] !== after[index + 1]
        )
          throw new Error("스티커 여백이 투명하지 않습니다.");
        if (live) {
          url = decoratedUrl;
          setSource(url);
          setReport(
            `통과: 1280×3434 PNG · 스티커 반영 ${changed}픽셀 · 투명 여백 유지`,
          );
        } else URL.revokeObjectURL(decoratedUrl);
      } finally {
        URL.revokeObjectURL(baseUrl);
      }
    }
    verify().catch((error) => {
      if (live) setReport(`실패: ${error.message}`);
    });
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);
  return (
    <main>
      <h1>스티커 출력 확인</h1>
      <output>{report}</output>
      {source && (
        <img
          src={source}
          alt="스티커를 합성한 PNG"
          style={{ display: "block", width: 280 }}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<OutputHarness />);
