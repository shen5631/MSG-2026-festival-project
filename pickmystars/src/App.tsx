import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { asset, idols, type Category, type ScreenId } from "./data/idols";
import { GameContext } from "./state/GameContext";
import { HomePage } from "./pages/HomePage";
import { PlayPage } from "./pages/PlayPage";
import { ResultPage } from "./pages/ResultPage";
import { PhotoPage } from "./pages/PhotoPage";

export default function App() {
  const [category, setCategory] = useState<Category>("girl");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [round, setRound] = useState(16);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("home");
  const [leavingScreen, setLeavingScreen] = useState<ScreenId | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const activeScreenRef = useRef<ScreenId>("home");
  const winner = idols[category][selectedIndex];

  const navigate = useCallback((screen: ScreenId) => {
    if (screen === activeScreenRef.current) return;
    animations.current.forEach((animation) => animation.cancel());
    animations.current = [];
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setLeavingScreen(reducedMotion ? null : activeScreenRef.current);
    setActiveScreen(screen);
    activeScreenRef.current = screen;
    window.scrollTo(0, 0);
  }, []);

  useLayoutEffect(() => {
    if (!leavingScreen) return;
    const outgoing = canvasRef.current?.querySelector<HTMLElement>(
      `#${leavingScreen}`,
    );
    const incoming = canvasRef.current?.querySelector<HTMLElement>(
      `#${activeScreen}`,
    );
    if (!outgoing || !incoming) return;
    const fadeOut = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 180,
      easing: "cubic-bezier(.22, 1, .36, 1)",
      fill: "forwards",
    });
    const fadeIn = incoming.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 320,
      easing: "cubic-bezier(.22, 1, .36, 1)",
    });
    animations.current = [fadeOut, fadeIn];
    fadeOut.onfinish = () => setLeavingScreen(null);
    return () => {
      fadeOut.cancel();
      fadeIn.cancel();
    };
  }, [activeScreen, leavingScreen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") navigate("home");
    };
    window.addEventListener("keydown", handleKeyDown);
    Object.values(idols)
      .flat()
      .forEach((idol) => {
        const image = new Image();
        image.src = idol.image;
        image.decode().catch(() => {});
      });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const selectCategory = (nextCategory: Category) => {
    setCategory(nextCategory);
    setSelectedCategory(nextCategory);
    setSelectedIndex(0);
  };

  const selectWinner = (index: number) => {
    setSelectedIndex(index);
    navigate("result");
  };

  const theme =
    activeScreen === "home" ? "yellow" : category === "boy" ? "blue" : "pink";
  return (
    <GameContext.Provider
      value={{
        category,
        selectedCategory,
        round,
        candidates: idols[category],
        winner,
        particle: category === "boy" && selectedIndex === 1 ? "과" : "와",
        activeScreen,
        leavingScreen,
        navigate,
        selectCategory,
        setRound,
        selectWinner,
      }}
    >
      <main
        id="stage"
        data-theme={category}
        data-screen={activeScreen === "home" ? undefined : activeScreen}
        style={{ backgroundImage: `url("${asset(`${theme}.svg`)}")` }}
      >
        <div className="design-canvas" ref={canvasRef}>
          <HomePage />
          <PlayPage />
          <ResultPage />
          <PhotoPage />
        </div>
      </main>
    </GameContext.Provider>
  );
}
