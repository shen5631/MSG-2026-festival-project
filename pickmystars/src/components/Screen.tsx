import type { ReactNode } from "react";
import type { ScreenId } from "../data/idols";
import { useGame } from "../state/GameContext";

export function Screen({
  id,
  children,
}: {
  id: ScreenId;
  children: ReactNode;
}) {
  const { activeScreen, leavingScreen, category } = useGame();
  const className = [
    "screen",
    activeScreen !== id && leavingScreen !== id ? "hidden" : "",
    leavingScreen === id ? "leaving" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section
      id={id}
      className={className}
      data-theme={id === "result" ? category : undefined}
    >
      {children}
    </section>
  );
}
