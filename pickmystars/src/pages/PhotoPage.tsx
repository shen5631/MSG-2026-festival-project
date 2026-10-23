import { useEffect, useRef, useState } from "react";
import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";
import { usePhotobooth } from "../hooks/usePhotobooth";

const frames = [
  { color: "#f4bbd5", name: "핑크" },
  { color: "#b6cdf4", name: "파랑" },
  { color: "#ffe78f", name: "노랑" },
  { color: "#ffffff", name: "흰색" },
];

export function PhotoPage() {
  const { winner, navigate, activeScreen, category } = useGame();
  const active = activeScreen === "photo";
  const booth = usePhotobooth(active);
  const [frame, setFrame] = useState(
    category === "boy" ? "#b6cdf4" : "#f4bbd5",
  );
  useEffect(() => {
    if (active) setFrame(category === "boy" ? "#b6cdf4" : "#f4bbd5");
  }, [active, category]);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [mailError, setMailError] = useState("");
  const [sent, setSent] = useState(false);
  const sendLock = useRef(false);
  const session = useRef(0);
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    session.current++;
    request.current?.abort();
    sendLock.current = false;
    setEmailOpen(false);
    setEmail("");
    setMailError("");
    setSent(false);
    setSending(false);
    return () => {
      session.current++;
      request.current?.abort();
    };
  }, [active, winner.id]);
  const sendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendLock.current || sent) return;
    sendLock.current = true;
    const version = session.current;
    const controller = new AbortController();
    request.current = controller;
    setSending(true);
    setMailError("");
    try {
      const photo = await booth.makeEmailPhoto(frame);
      if (version !== session.current) return;
      const response = await fetch("/api/photo-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), photo }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (version !== session.current) return;
      if (!response.ok)
        throw new Error(
          result?.message ||
            "메일을 전송하지 못했어요. 잠시 후 다시 시도해주세요.",
        );
      setSent(true);
      setEmail("");
    } catch (error) {
      if (version === session.current && !controller.signal.aborted)
        setMailError(
          error instanceof Error ? error.message : "전송에 실패했어요.",
        );
    } finally {
      if (version === session.current) {
        sendLock.current = false;
        setSending(false);
      }
    }
  };
  const complete = booth.shots.length === 4 && !booth.shooting;
  const ready = booth.status === "ready";
  const primaryLabel =
    booth.status === "requesting"
      ? "카메라 연결 중…"
      : !ready
        ? "카메라 켜기"
        : booth.shooting
          ? "촬영 중…"
          : complete
            ? "네컷 촬영 완료"
            : "네컷 촬영하기";

  return (
    <Screen id="photo">
      <button className="back" onClick={() => navigate("result")}>
        ← 결과로 돌아가기
      </button>
      <h2>
        나만의 네컷 <em>찰칵!</em>
      </h2>
      <p className="intro">오늘의 나를 네컷으로 남겨보세요</p>
      <div className="booth-layout">
        <div className="camera-panel">
          <p>카메라 미리보기</p>
          <div className="camera solo-camera">
            <div className="camera-person">
              <video
                ref={booth.videoRef}
                autoPlay
                playsInline
                muted
                className={ready ? "live-camera" : "live-camera camera-hidden"}
                aria-label="내 카메라 미리보기"
              />
              {!ready && (
                <div className="camera-instructions">
                  <span className="person-outline" aria-hidden="true">
                    ♧
                  </span>
                  <strong>
                    {booth.status === "requesting"
                      ? "카메라 권한을 허용해주세요"
                      : "카메라를 켜주세요"}
                  </strong>
                  <small>아래 ‘카메라 켜기’를 눌러 시작해요</small>
                </div>
              )}
            </div>
            {booth.countdown !== null && (
              <div className="camera-countdown" aria-live="assertive">
                {booth.countdown}
              </div>
            )}
            <span className="camera-badge">
              {complete ? "촬영 완료! 이메일로 받아보세요" : "나만의 네컷"}
            </span>
          </div>
          <p className="shot-count" aria-live="polite">
            {booth.shots.length} / 4{booth.shooting ? " · 촬영 중" : ""}
          </p>
          <div className="shot-thumbnails">
            {[0, 1, 2, 3].map((index) => (
              <div key={index}>
                {booth.shots[index] ? (
                  <img
                    src={booth.shots[index]}
                    alt={`${index + 1}번째 촬영 사진`}
                  />
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>
          <p className="camera-status" role={booth.error ? "alert" : "status"}>
            {booth.error ||
              (complete
                ? "네 장을 모두 찍었어요. 프레임을 고른 뒤 이메일로 받아보세요."
                : "촬영 화면을 나가면 카메라가 꺼집니다. 이메일 전송 시 완성 사진을 전송합니다.")}
          </p>
        </div>
        <div className="booth-settings">
          <div className="settings-body">
            <h3>나만의 포토부스</h3>
            <p className="solo-photo-guide">
              편하게 포즈를 취하고 나만의 네컷을 남겨보세요.
            </p>
            <p>프레임 색상</p>
            <div className="swatches">
              {frames.map((option) => (
                <button
                  key={option.color}
                  className="frame-swatch"
                  style={{ background: option.color }}
                  aria-label={`${option.name} 프레임`}
                  aria-pressed={frame === option.color}
                  disabled={booth.shooting || emailOpen}
                  onClick={() => setFrame(option.color)}
                >
                  {frame === option.color ? "✓" : ""}
                </button>
              ))}
            </div>
            <p>촬영 타이머</p>
            <div className="timer-preview">
              {[3, 5, 10].map((seconds) => (
                <button
                  key={seconds}
                  aria-pressed={booth.seconds === seconds}
                  disabled={booth.shooting}
                  onClick={() => booth.setSeconds(seconds)}
                >
                  {seconds}초
                </button>
              ))}
            </div>
            <button
              className="primary wide"
              disabled={
                booth.status === "requesting" ||
                booth.shooting ||
                (ready && complete)
              }
              onClick={ready ? booth.takePhotos : booth.startCamera}
            >
              {primaryLabel}
            </button>
          </div>
          <div className="strip-preview">
            <p>완성 미리보기</p>
            <div className="photo-strip" style={{ background: frame }}>
              {[0, 1, 2, 3].map((index) =>
                booth.shots[index] ? (
                  <img
                    key={index}
                    className="solo-strip-slot"
                    alt={`${index + 1}번째 완성 사진`}
                    src={booth.shots[index]}
                  />
                ) : (
                  <div
                    key={index}
                    className="solo-strip-slot solo-strip-empty"
                    aria-label={`${index + 1}번째 촬영 대기`}
                  >
                    {index + 1}
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="booth-actions">
            <button
              className="secondary"
              disabled={booth.shots.length === 0 || booth.shooting || sending}
              onClick={() => {
                booth.retake();
                setEmailOpen(false);
                setSent(false);
                setMailError("");
                setEmail("");
              }}
            >
              다시 찍기
            </button>
            <button
              className="primary"
              disabled={!complete || sending || sent}
              onClick={() => {
                setEmailOpen(true);
                setMailError("");
              }}
            >
              {sent ? "전송 요청 완료" : "이메일로 전송하기"}
            </button>
          </div>
          {emailOpen && (
            <form className="email-form" onSubmit={sendEmail}>
              {sent ? (
                <p role="status">
                  메일 전송 요청이 접수됐어요! 받은편지함과 스팸함을
                  확인해주세요.
                </p>
              ) : (
                <>
                  <label htmlFor="photo-email">사진을 받을 이메일 주소</label>
                  <input
                    id="photo-email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="example@email.com"
                    value={email}
                    disabled={sending}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <p>
                    입력한 주소로 완성 사진을 보내요. 전송을 위해 이메일 주소와
                    사진이 메일 서비스에 전달됩니다.
                  </p>
                  {mailError && <p role="alert">{mailError}</p>}
                  <button className="primary" type="submit" disabled={sending}>
                    {sending ? "전송 중…" : "이 주소로 전송하기"}
                  </button>
                  <button
                    className="secondary"
                    type="button"
                    disabled={sending}
                    onClick={() => {
                      setEmailOpen(false);
                      setEmail("");
                      setMailError("");
                    }}
                  >
                    취소
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
      <button
        className="guestbook-photo-link"
        onClick={() => navigate("guestbook")}
      >
        한마디 남기기 <span aria-hidden="true">›</span>
      </button>
    </Screen>
  );
}
