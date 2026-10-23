# P!ck My St☆r

2026 MSG 관악구 청아즐 페스티벌 전시 부스를 위한 아이돌 이상형 월드컵 웹앱입니다.

[서비스 바로가기](https://pickmystar.netlify.app/)

## 주요 기능

- 남자·여자 아이돌 각 64명 중 카테고리 선택
- 16강·32강·64강 랜덤 대진, 승자 진출, 라운드별 게이지와 최종 우승자 표시
- 카테고리 카드의 호버·클릭 피드백과 강수 선택 표시의 슬라이드 전환
- 웹캠 네컷 촬영, 3·5·10초 타이머, 프레임 색 변경 및 다시 찍기
- 우승자와 합성한 네컷 사진을 Gmail로 전송
- 익명 방명록 작성·최신순 조회·페이지 이동 및 Firebase 실시간 공유
- Firebase에 최종 우승 횟수 기록. 순위 화면은 아직 제공하지 않습니다.

로그인 없이 사용하며, React + TypeScript + Vite, React Router, Firebase Realtime Database, Netlify Functions, Nodemailer를 사용합니다.

## 로컬 실행

Node.js **24 권장**(최소 22.12), npm이 필요합니다. 저장소 루트에서 실행합니다.

```sh
cd pickmystars
npm install
npm run dev
```

터미널에 표시되는 주소를 엽니다. 기본 주소는 `http://localhost:5173`이며 사용 중이면 포트가 달라집니다.
실행 중에는 터미널을 유지하고, 종료할 때는 `Ctrl + C`를 누릅니다. HTML 직접 실행이나 Live Server 대신 Vite를 사용합니다.
패치를 받거나 브랜치를 바꾼 뒤 패키지를 찾지 못하면 `npm install`을 다시 실행합니다.

Firebase 방명록과 이메일 전송에는 별도 환경변수가 필요합니다. 설정 방법은 [앱 개발 안내](pickmystars/README.md)를 참고하세요.

## Netlify 배포

`pickmystars` 폴더에서, 배포할 코드가 있는 브랜치를 먼저 확인합니다.

```sh
git branch --show-current
npx netlify deploy --build --prod
```

현재 체크아웃된 로컬 코드를 빌드해 연결된 사이트에 정식 배포합니다. GitHub 연결은 필수가 아닙니다.
초기 사이트 연결, 환경변수 설정과 확인 절차는 [배포 안내](pickmystars/README.md#netlify-배포)를 참고하세요.
`dist`만 파일 업로드하면 이메일 서버 함수는 배포되지 않습니다.

## 확인 명령

`pickmystars` 폴더에서 실행합니다.

```sh
npm test
npm run build
npm run format:check
```

최근 사진 교체 작업에서 전체 128명 대표 사진의 로컬 HTTP 응답과 브라우저의 16강 → 결과 → 포토부스 진입을 확인했습니다.
카메라 실촬영·실제 이메일 수신·배포 환경의 Firebase 연결은 전시용 컴퓨터에서 별도로 확인해야 합니다.
