import { useEffect, useRef, useState } from "react";
import { Screen } from "../components/Screen";
import { useGame } from "../state/GameContext";
import { prepareEntry, type GuestbookEntry } from "../guestbook/storage";
import { addEntry, subscribeEntries } from "../guestbook/remote";

const PAGE_SIZE = 4;
export function GuestbookPage() {
  const { navigate, activeScreen, guestbookWinner } = useGame();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  // 저장이 늦어져 다시 눌러도 같은 글이 두 번 올라가지 않도록 같은 id를 재사용합니다.
  const pending = useRef<{ key: string; entry: GuestbookEntry } | null>(null);
  useEffect(() => {
    if (activeScreen !== "guestbook") {
      setNickname("");
      setMessage("");
      setNotice("");
      return;
    }
    setLoaded(false);
    setPage(1);
    return subscribeEntries(
      (rows) => {
        setEntries(rows);
        setLoaded(true);
        setError("");
      },
      () => setError("방명록을 불러오지 못했어요. 인터넷 연결을 확인해주세요."),
    );
  }, [activeScreen]);
  const pages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const key = `${nickname}
${message}
${guestbookWinner?.name ?? ""}`;
      if (pending.current?.key !== key)
        pending.current = {
          key,
          entry: prepareEntry(nickname, message, guestbookWinner?.name),
        };
      await addEntry(pending.current.entry);
      pending.current = null;
      setNickname("");
      setMessage("");
      setPage(1);
      setError("");
      setNotice("한마디를 남겼어요!");
    } catch (failure) {
      setNotice("");
      setError(
        failure instanceof Error && /입력/.test(failure.message)
          ? failure.message
          : "저장하지 못했어요. 입력한 글은 유지되니 다시 시도해주세요.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen id="guestbook">
      <button className="guestbook-back" onClick={() => navigate("home")}>
        처음으로 돌아가기 <span aria-hidden="true">›</span>
      </button>
      <div className="guestbook-title">
        <h1>방명록</h1>
        <p>기록을 남겨보세요!</p>
      </div>
      <div className="guestbook-layout">
        <form className="guestbook-panel guestbook-form" onSubmit={submit}>
          <h2>나의 한마디</h2>
          {guestbookWinner && (
            <span className="guestbook-tag">
              나의 최애 · {guestbookWinner.name}
            </span>
          )}
          <label htmlFor="guestbook-nickname">
            닉네임 <small>(선택)</small>
          </label>
          <input
            id="guestbook-nickname"
            value={nickname}
            maxLength={20}
            placeholder="비워두면 익명으로 표시돼요"
            autoComplete="off"
            onChange={(e) => setNickname(e.target.value)}
          />
          <label htmlFor="guestbook-message">남기고 싶은 말</label>
          <div className="guestbook-textarea">
            <textarea
              id="guestbook-message"
              value={message}
              maxLength={150}
              required
              placeholder="최애에게 응원 한마디를 남겨주세요"
              onChange={(e) => {
                setMessage(e.target.value);
                setNotice("");
              }}
            />
            <span>{message.length} / 150</span>
          </div>
          {error && (
            <p className="guestbook-feedback" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="guestbook-feedback" role="status">
              {notice}
            </p>
          )}
          <button
            className="guestbook-submit"
            disabled={!loaded || saving || !message.trim()}
            type="submit"
          >
            {saving ? "남기는 중…" : "한마디 남기기"}
          </button>
          <p className="guestbook-help">
            모두가 함께 보는 공간이에요.
            <br />
            따뜻한 말을 남겨주세요.
          </p>
        </form>
        <div className="guestbook-panel guestbook-list">
          <div className="guestbook-list-heading">
            <h2>모두의 한마디</h2>
            <span>총 {entries.length}개의 글</span>
            <small>최신순</small>
          </div>
          {!loaded ? (
            <div className="guestbook-empty">
              방명록을 불러오는 중이에요.
              <br />
              오류가 표시되면 인터넷 연결을 확인해주세요.
            </div>
          ) : entries.length === 0 ? (
            <div className="guestbook-empty">
              <span aria-hidden="true">✦</span>
              <strong>첫 번째 한마디를 남겨주세요!</strong>
              <p>오늘의 최애와 함께한 소감을 들려주세요.</p>
            </div>
          ) : (
            <div className="guestbook-cards">
              {entries
                .slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
                .map((entry) => (
                  <article className="guestbook-entry" key={entry.id}>
                    <span className="guestbook-star" aria-hidden="true">
                      ★
                    </span>
                    {entry.idol && (
                      <span className="guestbook-tag">
                        나의 최애 · {entry.idol}
                      </span>
                    )}
                    <h3>{entry.nickname}</h3>
                    <p>{entry.message}</p>
                    <time dateTime={new Date(entry.createdAt).toISOString()}>
                      {new Intl.DateTimeFormat("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }).format(entry.createdAt)}
                    </time>
                  </article>
                ))}
            </div>
          )}
          {entries.length > PAGE_SIZE && (
            <nav className="guestbook-pagination" aria-label="방명록 페이지">
              <button
                aria-label="이전 페이지"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                ‹
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter(
                  (n) => n === 1 || n === pages || Math.abs(n - current) <= 1,
                )
                .map((n, i, arr) => (
                  <span key={n}>
                    {i > 0 && n - arr[i - 1] > 1 && (
                      <span aria-hidden="true">…</span>
                    )}
                    <button
                      aria-label={`${n}페이지`}
                      aria-current={current === n ? "page" : undefined}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  </span>
                ))}
              <button
                aria-label="다음 페이지"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
              >
                ›
              </button>
            </nav>
          )}
          <p className="guestbook-storage-note">
            남긴 글은 모든 기기에 실시간으로 공유돼요.
          </p>
        </div>
      </div>
    </Screen>
  );
}
