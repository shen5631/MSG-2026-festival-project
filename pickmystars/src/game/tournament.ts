export const START_SIZES = [16, 32, 64] as const;
export type StartSize = (typeof START_SIZES)[number];

export interface Candidate {
  id: string;
}
export interface MatchRecord {
  id: string;
  roundSize: number;
  matchNumber: number;
  candidateIds: [string, string];
  winnerId: string;
}
export interface Tournament<T extends Candidate> {
  roundCandidates: T[];
  nextRound: T[];
  matchIndex: number;
  initialSize: StartSize;
  history: MatchRecord[];
  winner: T | null;
}

export function createTournament<T extends Candidate>(
  roster: readonly T[],
  size: StartSize,
  random: () => number = Math.random,
): Tournament<T> {
  if (!START_SIZES.includes(size))
    throw new Error("지원하지 않는 시작 인원입니다.");
  if (new Set(roster.map((candidate) => candidate.id)).size !== roster.length) {
    throw new Error("후보 ID는 중복될 수 없습니다.");
  }
  if (roster.length < size)
    throw new Error("선택한 라운드에 필요한 후보가 부족합니다.");
  const shuffled = [...roster];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const value = random();
    if (value < 0 || value >= 1 || !Number.isFinite(value))
      throw new Error("잘못된 난수입니다.");
    const target = Math.floor(value * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return {
    roundCandidates: shuffled.slice(0, size),
    nextRound: [],
    matchIndex: 0,
    initialSize: size,
    history: [],
    winner: null,
  };
}

export function getMatch<T extends Candidate>(game: Tournament<T>): [T, T] {
  const offset = game.matchIndex * 2;
  return [game.roundCandidates[offset], game.roundCandidates[offset + 1]];
}

export function chooseCandidate<T extends Candidate>(
  game: Tournament<T>,
  winnerId: string,
): Tournament<T> {
  if (game.winner) throw new Error("이미 종료된 게임입니다.");
  const pair = getMatch(game);
  const winner = pair.find((candidate) => candidate.id === winnerId);
  if (!winner) throw new Error("현재 대결에 없는 후보입니다.");
  const roundSize = game.roundCandidates.length;
  const nextRound = [...game.nextRound, winner];
  const history = [
    ...game.history,
    {
      id: `${roundSize}-${game.matchIndex + 1}`,
      roundSize,
      matchNumber: game.matchIndex + 1,
      candidateIds: [pair[0].id, pair[1].id] as [string, string],
      winnerId,
    },
  ];
  if (roundSize === 2) return { ...game, nextRound, history, winner };
  if (nextRound.length === roundSize / 2) {
    return {
      ...game,
      roundCandidates: nextRound,
      nextRound: [],
      matchIndex: 0,
      history,
    };
  }
  return { ...game, nextRound, matchIndex: game.matchIndex + 1, history };
}

export function getRoundLabel(size: number): string {
  return size === 2 ? "결승" : `${size}강`;
}
