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
  const { category } = useGame();
  return (
    <section
      id={id}
      className="screen"
      data-theme={id === "result" ? category : undefined}
    >
      {children}
    </section>
  );
}
