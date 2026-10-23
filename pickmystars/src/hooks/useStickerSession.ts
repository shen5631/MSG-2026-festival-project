import { useEffect, useReducer, useState } from "react";
import {
  emptyStickerSession,
  remainingSeconds,
  stickerReducer,
} from "../photo/stickers";

export function useStickerSession(
  shotKey: string | undefined,
  active: boolean,
) {
  const [state, dispatch] = useReducer(stickerReducer, emptyStickerSession);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    dispatch({ type: "reset" });
    setNow(Date.now());
  }, [shotKey, active]);
  useEffect(() => {
    if (state.deadline === null) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= state.deadline!) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [state.deadline]);
  const seconds = remainingSeconds(state.deadline, now);
  return {
    state,
    dispatch,
    seconds,
    expired: state.deadline !== null && seconds === 0,
    open: () => {
      setNow(Date.now());
      dispatch({ type: "open", now: Date.now() });
    },
    close: () => dispatch({ type: "close" }),
  };
}
