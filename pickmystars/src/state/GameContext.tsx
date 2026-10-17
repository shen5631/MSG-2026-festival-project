import { createContext, useContext } from "react";
import type { Category, Idol, ScreenId } from "../data/idols";

export interface GameContextValue {
  category: Category;
  selectedCategory: Category | null;
  round: number;
  candidates: Idol[];
  winner: Idol;
  particle: string;
  activeScreen: ScreenId;
  leavingScreen: ScreenId | null;
  navigate: (screen: ScreenId) => void;
  selectCategory: (category: Category) => void;
  setRound: (round: number) => void;
  selectWinner: (index: number) => void;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("GameContext provider is required.");
  return context;
}
