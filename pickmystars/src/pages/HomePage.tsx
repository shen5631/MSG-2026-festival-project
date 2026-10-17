import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";
import { asset } from "../data/idols";

export function HomePage() {
  const { selectedCategory, round, setRound, selectCategory, navigate } =
    useGame();

  return (
    <Screen id="home">
      <img
        className="logo"
        src={asset("title.png")}
        alt="당신의 최애를 골라보세요"
      />
      <p className="intro">
        이상형 월드컵을 통해
        <br />
        나의 최애를 찾아보세요
      </p>
      <div className="categories">
        <button
          className={`card category boy${selectedCategory === "boy" ? " selected" : ""}`}
          onClick={() => selectCategory("boy")}
        >
          <div className="photo pair">
            <img src={asset("boy-2.jpg")} alt="남자 아이돌 예시 1" />
            <img src={asset("boy-1.jpg")} alt="남자 아이돌 예시 2" />
          </div>
          <span className="card-label">
            남자 아이돌
            <small>이상형 월드컵</small>
          </span>
        </button>
        <button
          className={`card category${selectedCategory === "girl" ? " selected" : ""}`}
          onClick={() => selectCategory("girl")}
        >
          <div className="photo pair">
            <img src={asset("girl-1.jpg")} alt="여자 아이돌 예시 1" />
            <img src={asset("girl-2.jpg")} alt="여자 아이돌 예시 2" />
          </div>
          <span className="card-label">
            여자 아이돌
            <small>이상형 월드컵</small>
          </span>
        </button>
      </div>
      <div className="controls">
        <div className="rounds">
          <button
            className={round === 8 ? "on" : ""}
            onClick={() => setRound(8)}
          >
            8강
          </button>
          <button
            className={round === 16 ? "on" : ""}
            onClick={() => setRound(16)}
          >
            16강
          </button>
          <button
            className={round === 32 ? "on" : ""}
            onClick={() => setRound(32)}
          >
            32강
          </button>
        </div>
        <button className="primary wide" onClick={() => navigate("play")}>
          월드컵 시작하기
        </button>
      </div>
    </Screen>
  );
}
