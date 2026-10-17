import { Fragment, type CSSProperties } from "react";
import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";
import { getRoundLabel } from "../game/tournament";

export function PlayPage() {
  const {
    candidates,
    selectWinner,
    roundSize,
    matchNumber,
    totalMatches,
    progress,
    isPicking,
    pendingPick,
  } = useGame();
  const matchKey = `${roundSize}-${matchNumber}-${candidates[0].id}`;
  return (
    <Screen id="play">
      <div aria-live="polite" aria-atomic="true">
        <strong>
          {getRoundLabel(roundSize)}{" "}
          <span>
            {matchNumber}/{totalMatches}
          </span>
        </strong>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="현재 라운드 진행률"
        aria-valuemin={0}
        aria-valuemax={totalMatches}
        aria-valuenow={matchNumber - 1 + (pendingPick !== null ? 1 : 0)}
        style={{ "--match-progress": `${progress}%` } as CSSProperties}
      />
      <div className="matches" key={matchKey}>
        {candidates.map((candidate, index) => (
          <Fragment key={candidate.id}>
            {index === 1 && <span className="vs">VS</span>}
            <button
              className={`card idol${pendingPick === index ? " picked" : ""}`}
              disabled={isPicking}
              onClick={() => selectWinner(index)}
              aria-label={`${candidate.name} 선택`}
            >
              <div className="photo portrait">
                <img
                  data-portrait={index}
                  src={candidate.image}
                  alt={candidate.name}
                />
              </div>
              <span className="card-label">
                {candidate.name}
                <small>{candidate.group}</small>
              </span>
            </button>
          </Fragment>
        ))}
      </div>
    </Screen>
  );
}
