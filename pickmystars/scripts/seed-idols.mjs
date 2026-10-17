// 아이돌 초기 데이터를 Realtime Database의 idols/ 에 넣습니다.
// 사용: node scripts/seed-idols.mjs [--force]
// 이미 데이터가 있으면 우승 기록(wins)이 0으로 초기화되므로 --force 없이는 중단합니다.
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
);
const base = `https://${env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`;

// idols.ts는 import.meta.env를 쓰므로 BASE_URL을 빈 값으로 바꾼 사본을 불러옵니다.
const source = readFileSync(new URL("../src/data/idols.ts", import.meta.url), "utf8")
  .replaceAll("import.meta.env.BASE_URL", '""');
const dir = mkdtempSync(join(tmpdir(), "idols-"));
const file = join(dir, "idols.ts");
writeFileSync(file, source);
const { getTournamentRoster } = await import(pathToFileURL(file).href);

const data = {};
for (const gender of ["boy", "girl"]) {
  for (const idol of getTournamentRoster(gender)) {
    data[idol.id] = {
      gender,
      name: idol.name,
      group: idol.group,
      image: idol.image,
      photo: idol.photo ?? idol.image,
      ...(idol.demo ? { demo: true } : {}),
      wins: 0,
    };
  }
}

const existing = await (await fetch(`${base}/idols.json`)).json();
if (existing?.error) {
  console.error("DB 접근 실패:", existing.error, "(규칙에서 idols 읽기·쓰기를 허용했는지 확인하세요)");
  process.exit(1);
}
if (existing && !process.argv.includes("--force")) {
  console.error("idols에 이미 데이터가 있어요. 덮어쓰려면 --force를 붙이세요.");
  process.exit(1);
}
const response = await fetch(`${base}/idols.json`, {
  method: "PUT",
  body: JSON.stringify(data),
});
if (!response.ok) {
  console.error("저장 실패:", response.status, await response.text());
  process.exit(1);
}
console.log(`${Object.keys(data).length}명 저장 완료`);
