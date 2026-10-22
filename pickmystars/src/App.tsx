import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
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
import { GuestbookPage } from "./pages/GuestbookPage";
import { recordWinner } from "./lib/winners";

const screenPath = (screen: ScreenId) =>
  screen === "home" ? "/" : `/${screen}`;

const pathScreen = (pathname: string): ScreenId => {
  const screen = pathname.slice(1);
  return ["play", "result", "photo", "guestbook"].includes(screen)
    ? (screen as ScreenId)
    : "home";
};

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const activeScreen = pathScreen(location.pathname);
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const activeScreenRef = useRef<ScreenId>(activeScreen);
  activeScreenRef.current = activeScreen;
  const winner = game?.winner ?? idols[category][0];
  const candidates = game ? getMatch(game) : idols[category];
  const roundSize = game?.roundCandidates.length ?? round;
  const matchNumber = (game?.matchIndex ?? 0) + 1;
  const totalMatches = roundSize / 2;
  const progress =
    pendingPick !== null
      ? (matchNumber / totalMatches) * 100
      : ((matchNumber - 1) / totalMatches) * 100;

  const navigate = useCallback(
    (screen: ScreenId) => {
      if (screen === activeScreenRef.current) return;
      routerNavigate(screenPath(screen));
    },
    [routerNavigate],
  );

  // 뒤로가기 등 어떤 방식으로 화면이 바뀌어도 진행 중인 선택을 정리하고 새 화면을 페이드인합니다.
  useLayoutEffect(() => {
    pickTimers.current.forEach(clearTimeout);
    pickTimers.current = [];
    pickLocked.current = false;
    setIsPicking(false);
    setPendingPick(null);
    window.scrollTo(0, 0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const incoming = canvasRef.current?.querySelector<HTMLElement>(
      `#${activeScreen}`,
    );
    const fadeIn = incoming?.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 320,
      easing: "cubic-bezier(.22, 1, .36, 1)",
    });
    return () => fadeIn?.cancel();
  }, [activeScreen]);

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
          recordWinner(next.winner);
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

  // 새로고침이나 주소 직접 입력으로 진행 정보 없이 들어오면 처음 화면으로 보냅니다.
  const home = <Navigate to="/" replace />;
  const finished = Boolean(game?.winner);

  const theme = ["home", "guestbook"].includes(activeScreen)
    ? "yellow"
    : category === "boy"
      ? "blue"
      : "pink";
  return (
    <GameContext.Provider
      value={{
        guestbookWinner: game?.winner ?? null,
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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/play"
              element={
                !game ? (
                  home
                ) : game.winner ? (
                  <Navigate to="/result" replace />
                ) : (
                  <PlayPage />
                )
              }
            />
            <Route path="/result" element={finished ? <ResultPage /> : home} />
            <Route path="/photo" element={finished ? <PhotoPage /> : home} />
            <Route path="/guestbook" element={<GuestbookPage />} />
            <Route path="*" element={home} />
          </Routes>
        </div>
      </main>
    </GameContext.Provider>
  );
}
