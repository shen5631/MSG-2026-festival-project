import test from "node:test";
import assert from "node:assert/strict";
import {
  createTournament,
  chooseCandidate,
  getMatch,
  getRoundLabel,
} from "../src/game/tournament.ts";
const roster = Array.from({ length: 64 }, (_, i) => ({ id: `idol-${i}` }));
function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}
for (const size of [16, 32, 64]) {
  test(`${size}강: 중복 없는 추첨, 승자 진출, 게이지와 결승까지 ${size - 1}경기`, () => {
    let game = createTournament(roster, size, randomGenerator(size));
    const initial = game.roundCandidates.map((x) => x.id);
    assert.equal(new Set(initial).size, size);
    assert.equal(roster.length, 64);
    const entrants = new Map([[size, [...initial]]]);
    while (!game.winner) {
      const pair = getMatch(game);
      assert.notEqual(pair[0].id, pair[1].id);
      const previousSize = game.roundCandidates.length;
      const previousIndex = game.matchIndex;
      const chosen = pair[game.history.length % 2];
      const next = chooseCandidate(game, chosen.id);
      assert.equal(next.history.at(-1).winnerId, chosen.id);
      assert.equal(next.history.at(-1).matchNumber, previousIndex + 1);
      if (!next.winner && next.roundCandidates.length !== previousSize) {
        assert.equal(next.matchIndex, 0);
        const winners = next.history
          .filter((m) => m.roundSize === previousSize)
          .map((m) => m.winnerId);
        assert.deepEqual(
          next.roundCandidates.map((x) => x.id),
          winners,
        );
        entrants.set(next.roundCandidates.length, winners);
      }
      game = next;
    }
    assert.equal(game.history.length, size - 1);
    assert.equal(game.history.filter((x) => x.roundSize === 2).length, 1);
    assert.equal(game.winner.id, game.history.at(-1).winnerId);
    assert.deepEqual(
      [...entrants.keys()],
      size === 16
        ? [16, 8, 4, 2]
        : size === 32
          ? [32, 16, 8, 4, 2]
          : [64, 32, 16, 8, 4, 2],
    );
    assert.throws(() => chooseCandidate(game, game.winner.id));
  });
}
test("추첨은 재시작 시 섞이고 원본 명단을 변경하지 않는다", () => {
  const before = [...roster];
  const a = createTournament(roster, 16, randomGenerator(1));
  const b = createTournament(roster, 16, randomGenerator(2));
  assert.notDeepEqual(a.roundCandidates, b.roundCandidates);
  assert.deepEqual(roster, before);
});
test("부족한 인원, 중복 ID, 지원하지 않는 강수, 잘못된 선택 거부", () => {
  assert.throws(() => createTournament(roster.slice(0, 2), 16));
  assert.throws(() => createTournament([...roster, roster[0]], 16));
  assert.throws(() => createTournament(roster, 8));
  const game = createTournament(roster, 16, randomGenerator(3));
  assert.throws(() => chooseCandidate(game, "absent"));
  assert.equal(game.history.length, 0);
  assert.equal(getRoundLabel(2), "결승");
  assert.equal(getRoundLabel(4), "4강");
});
