import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  asset,
  idols,
  getTournamentRoster,
  getCompanionParticle,
  type Idol,
  type Category,
  type ScreenId,
} from "./data/idols";
import {
  createTournament,
  chooseCandidate,
  getMatch,
  type StartSize,
  type Tournament,
} from "./game/tournament";
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
  const [round, setRound] = useState<StartSize>(16);
  const [game, setGame] = useState<Tournament<Idol> | null>(null);
  const [pendingPick, setPendingPick] = useState<number | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const gameRef = useRef<Tournament<Idol> | null>(null);
  const pickLocked = useRef(false);
  const pickTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [activeScreen, setActiveScreen] = useState<ScreenId>("home");
  const [leavingScreen, setLeavingScreen] = useState<ScreenId | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  const activeScreenRef = useRef<ScreenId>("home");
  const winner = game?.winner ?? idols[category][0];
  const candidates = game ? getMatch(game) : idols[category];
  const roundSize = game?.roundCandidates.length ?? round;
  const matchNumber = (game?.matchIndex ?? 0) + 1;
  const totalMatches = roundSize / 2;
  const progress =
    pendingPick !== null
      ? (matchNumber / totalMatches) * 100
      : ((matchNumber - 1) / totalMatches) * 100;

  const navigate = useCallback((screen: ScreenId) => {
    if (screen === activeScreenRef.current) return;
    pickTimers.current.forEach(clearTimeout);
    pickTimers.current = [];
    pickLocked.current = false;
    setIsPicking(false);
    setPendingPick(null);
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
  };

  useEffect(
    () => () => {
      pickTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const startGame = () => {
    const next = createTournament(getTournamentRoster(category), round);
    gameRef.current = next;
    setGame(next);
    navigate("play");
  };

  const selectWinner = (index: number) => {
    const current = gameRef.current;
    if (
      !current ||
      current.winner ||
      pickLocked.current ||
      activeScreenRef.current !== "play"
    )
      return;
    const candidate = getMatch(current)[index];
    if (!candidate) return;
    pickLocked.current = true;
    setIsPicking(true);
    setPendingPick(index);
    // 선택 강조와 게이지를 보여준 뒤 다음 대결로 진행합니다.
    pickTimers.current.push(
      setTimeout(() => {
        const next = chooseCandidate(current, candidate.id);
        gameRef.current = next;
        setGame(next);
        setPendingPick(null);
        if (next.winner) {
          navigate("result");
          return;
        }
        pickTimers.current.push(
          setTimeout(() => {
            pickLocked.current = false;
            setIsPicking(false);
          }, 220),
        );
      }, 180),
    );
  };

  const theme =
    activeScreen === "home" ? "yellow" : category === "boy" ? "blue" : "pink";
  return (
    <GameContext.Provider
      value={{
        category,
        selectedCategory,
        round,
        roundSize,
        matchNumber,
        totalMatches,
        progress,
        isPicking,
        pendingPick,
        startGame,
        candidates,
        winner,
        particle: getCompanionParticle(winner.name),
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
