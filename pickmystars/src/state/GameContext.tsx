import { createContext, useContext } from "react";
import type { Category, Idol, ScreenId } from "../data/idols";
import type { StartSize } from "../game/tournament";

export interface GameContextValue {
  guestbookWinner?: Idol | null;
  category: Category;
  selectedCategory: Category | null;
  round: StartSize;
  roundSize: number;
  matchNumber: number;
  totalMatches: number;
  progress: number;
  isPicking: boolean;
  pendingPick: number | null;
  startGame: () => void;
  candidates: Idol[];
  winner: Idol;
  particle: string;
  activeScreen: ScreenId;
  navigate: (screen: ScreenId) => void;
  selectCategory: (category: Category) => void;
  setRound: (round: StartSize) => void;
  selectWinner: (index: number) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("GameContext provider is required.");
  return context;
}
