# P!ck My St☆r · React UI

기존 HTML의 화면 구성, CSS, 이미지와 예시 동작을 유지한 React + TypeScript + Vite 프로젝트입니다.

## 실행

Node.js 22.12 이상을 설치한 뒤 이 폴더에서 실행합니다.

```sh
npm install
npm run dev
```

터미널에 표시되는 로컬 주소를 브라우저에서 엽니다. React 소스는 Live Server 대신 Vite로 실행합니다.

```sh
npm run typecheck
npm run build
npm run preview
```

## 구조

- `src/pages/`: 메인, 대결, 결과, 포토부스 화면
- `src/components/Screen.tsx`: 화면 표시 상태
- `src/state/GameContext.tsx`: 공유 상태와 타입
- `src/data/idols.ts`: 아이돌 이름, 그룹, 사진 경로
- `src/App.tsx`: 선택 상태와 기존 화면 전환 효과
- `src/styles/app.css`: 기존 CSS (디자인 유지)
- `public/assets/`: 기존 이미지·배경·로고

월드컵 진행은 동작하며, 촬영·이메일·DB는 아직 연결하지 않았습니다.

## 월드컵 진행

- 메인에서 16강·32강·64강을 선택하면 중복 ID 없이 후보를 랜덤 추첨합니다.
- 각 대결의 선택 후보만 다음 라운드로 진출하며 결승 후 결과·포토부스에 연결됩니다.
- 진행 막대는 현재 라운드 기준이며, 다음 라운드에서 0%로 초기화됩니다.
- 선택 중에는 입력을 잠가 더블클릭이 다음 경기까지 진행시키지 않도록 합니다.
- 실제 사진은 아직 남돌·여돌 각 2명입니다. 나머지는 기존 사진을 재사용하는 이름이 다른 임시 후보이며 실제 인기도 데이터가 아닙니다.
- 실제 명단은 `src/data/idols.ts`에 고유 ID와 함께 추가하고 `getTournamentRoster`의 임시 후보 생성을 제거하면 됩니다.
- `npm test`로 16·32·64강의 진출·완료·입력 검증을 확인합니다.
