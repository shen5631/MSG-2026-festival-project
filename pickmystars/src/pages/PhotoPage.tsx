import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";

export function PhotoPage() {
  const { winner, navigate } = useGame();

  return (
    <Screen id="photo">
      <button className="back" onClick={() => navigate("result")}>
        ← 결과로 돌아가기
      </button>
      <h2>
        최애와 함께 <em>찰칵!</em>
      </h2>
      <p className="intro">우리만의 특별한 순간을 남겨보세요</p>
      <div className="booth-layout">
        <div className="camera-panel">
          <p>카메라 미리보기</p>
          <div className="camera">
            <div className="camera-person">
              <span className="person-outline" aria-hidden="true">
                ♧
              </span>
              <strong>내가 들어갈 자리</strong>
              <small>카메라 미리보기</small>
            </div>
            <img
              className="booth-idol camera-idol"
              alt="함께 촬영할 최애"
              src={winner.image}
            />
            <span className="camera-badge">함께 남기는 네컷</span>
          </div>
          <p className="shot-count">1 / 4</p>
          <div className="shot-thumbnails">
            <div>1</div>
            <div>2</div>
            <div>3</div>
            <div>4</div>
          </div>
        </div>
        <div className="booth-settings">
          <div className="settings-body">
            <h3>나만의 포토부스</h3>
            <div className="chosen-idol">
              <img
                className="booth-idol"
                alt="선택한 최애"
                src={winner.image}
              />
              <strong className="booth-name">{winner.name}</strong>
            </div>
            <p>프레임 색상</p>
            <div className="swatches">
              <i style={{ background: "#f4bbd5" }}></i>
              <i style={{ background: "#b6cdf4" }}></i>
              <i style={{ background: "#ffe78f" }}></i>
              <i style={{ background: "#fff" }}></i>
            </div>
            <p>촬영 타이머</p>
            <div className="timer-preview">
              <span>3초</span>
              <span>5초</span>
              <span>10초</span>
            </div>
            <button className="primary wide" disabled>
              사진 찍기
            </button>
            <button className="secondary wide" disabled>
              사진 업로드
            </button>
          </div>
          <div className="strip-preview">
            <p>완성 미리보기</p>
            <div className="photo-strip">
              <img
                className="booth-idol"
                alt="선택한 최애"
                src={winner.image}
              />
              <img
                className="booth-idol"
                alt="선택한 최애"
                src={winner.image}
              />
              <img
                className="booth-idol"
                alt="선택한 최애"
                src={winner.image}
              />
              <img
                className="booth-idol"
                alt="선택한 최애"
                src={winner.image}
              />
            </div>
          </div>
          <div className="booth-actions">
            <button className="secondary" disabled>
              다시 찍기
            </button>
            <button className="primary" disabled>
              사진 저장하기
            </button>
          </div>
        </div>
      </div>
    </Screen>
  );
}
