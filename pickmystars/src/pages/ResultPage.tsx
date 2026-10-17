import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";

export function ResultPage() {
  const { winner, particle, navigate } = useGame();

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
              {`${winner.name}${particle} 함께 특별한 추억을 만들어 보세요`}
            </span>
          </div>
          <div className="actions">
            <button className="primary" onClick={() => navigate("photo")}>
              {`${winner.name}${particle} 사진 찍기`}
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
