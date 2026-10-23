import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";

export function ResultPage() {
  const { winner, navigate } = useGame();

  return (
    <Screen id="result">
      <div className="result">
        <div className="card idol">
          <div className="photo portrait">
            <img data-portrait="0" src={winner.image} alt={winner.name} />
          </div>
          <span className="card-label">
            {winner.name}
            <small>{winner.group}</small>
          </span>
        </div>
        <div className="result-details">
          <div className="winner-heading">
            <h1>
              당신의 최애는
              <br />
              <strong>{`${winner.name}입니다!`}</strong>
            </h1>
            <p className="winner-group">{winner.group}</p>
          </div>
          <div className="winner-message">
            당신의 이상형 월드컵의 우승자!
            <br />
            <span className="winner-invite">
              오늘의 나를 네컷 사진으로 남겨보세요
            </span>
          </div>
          <div className="actions">
            <button className="primary" onClick={() => navigate("photo")}>
              나만의 네컷 찍기
            </button>
            <button className="secondary" onClick={() => navigate("home")}>
              다시하기
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
