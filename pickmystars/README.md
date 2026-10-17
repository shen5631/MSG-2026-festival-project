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

현재 동작은 기존과 같은 UI 예시입니다. 실제 대진 진행, 촬영, 이메일, DB 기능은 아직 포함하지 않습니다.
