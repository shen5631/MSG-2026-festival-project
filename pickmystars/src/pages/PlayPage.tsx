import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";

export function PlayPage() {
  const { candidates, selectWinner } = useGame();

  return (
    <Screen id="play">
      <div>
        <strong>
          16강 <span>5/8</span>
        </strong>
      </div>
      <div className="progress"></div>

      <div className="matches">
        <button className="card idol" onClick={() => selectWinner(0)}>
          <div className="photo portrait">
            <img
              data-portrait="0"
              src={candidates[0].image}
              alt={candidates[0].name}
            />
          </div>
          <span className="card-label">
            {candidates[0].name}
            <small>{candidates[0].group}</small>
          </span>
        </button>
        <span className="vs">VS</span>
        <button className="card idol" onClick={() => selectWinner(1)}>
          <div className="photo portrait">
            <img
              data-portrait="1"
              src={candidates[1].image}
              alt={candidates[1].name}
            />
          </div>
          <span className="card-label">
            {candidates[1].name}
            <small>{candidates[1].group}</small>
          </span>
        </button>
      </div>
    </Screen>
  );
}
