// 개발 서버 전용: 서버에 결과를 기록하지 않고 두 테마의 선택·결과 UI를 확인합니다.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { PlayPage } from "../src/pages/PlayPage";
import { PhotoPage } from "../src/pages/PhotoPage";
import { ResultPage } from "../src/pages/ResultPage";
import { GameContext, type GameContextValue } from "../src/state/GameContext";
import { asset, idols, type Category, type ScreenId } from "../src/data/idols";
import "../src/styles/app.css";

function Harness() {
  const query = new URLSearchParams(location.search);
  const category: Category = query.get("theme") === "boy" ? "boy" : "girl";
  const [screen, setScreen] = useState<ScreenId>(
    query.get("view") === "photo"
      ? "photo"
      : query.get("view") === "result"
        ? "result"
        : "play",
  );
  const [pendingPick, setPendingPick] = useState<number | null>(null);
  const names = category === "boy" ? ["서정우", "유강민"] : ["스텔라", "이안"];
  const candidates = names.map((name) =>
    idols[category].find((idol) => idol.name === name)!,
  );
  const value: GameContextValue = {
    category,
    selectedCategory: category,
    round: 16,
    roundSize: 16,
    matchNumber: 5,
    totalMatches: 8,
    progress: pendingPick === null ? 50 : 62.5,
    isPicking: false,
    pendingPick,
    startGame: () => setScreen("play"),
    candidates,
    winner: candidates[0],
    particle: "와",
    activeScreen: screen,
    navigate: setScreen,
    selectCategory: () => {},
    setRound: () => {},
    selectWinner: setPendingPick,
  };
  return (
    <GameContext.Provider value={value}>
      <main
        id="stage"
        data-theme={category}
        data-screen={screen}
        style={{
          backgroundImage: `url("${asset(`${category === "boy" ? "blue" : "pink"}.svg`)}")`,
        }}
      >
        <div className="design-canvas">
          {screen === "photo" ? (
            <PhotoPage />
          ) : screen === "result" ? (
            <ResultPage />
          ) : (
            <PlayPage />
          )}
        </div>
        <footer className="site-footer">
          <span>2026 동아리 발표</span>
          <span>미림마이스터고등학교 · MSG</span>
        </footer>
      </main>
    </GameContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
