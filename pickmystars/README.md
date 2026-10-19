# P!ck My St☆r · 개발 안내

React + TypeScript + Vite 기반의 아이돌 이상형 월드컵·카메라 포토부스입니다.
통계 저장에는 Firebase Realtime Database를 사용하며, 별도 로그인 기능은 없습니다.

## 실행과 검사

이 README가 있는 `pickmystars` 폴더에서 실행합니다. Node.js 22.12 이상이 필요합니다.

```sh
npm install
npm run dev
```

터미널에 표시되는 로컬 주소로 접속합니다. 기본 주소는 `http://localhost:5173`입니다.
Live Server 대신 Vite를 사용하며, 서버 터미널을 닫으면 접속할 수 없습니다.

```sh
npm test
npm run typecheck
npm run build
npm run preview
```

- `npm test`: 월드컵 진행·입력 검증, 촬영 순서·취소·크롭 및 이메일 API 관련 자동 테스트 23개
- `npm run typecheck`: TypeScript 검사
- `npm run build`: 타입 검사 후 `dist/`에 배포용 파일 생성
- `npm run preview`: 빌드 결과를 로컬에서 확인. 주소는 터미널 출력 참고

## 월드컵과 아이돌 데이터

남돌·여돌 선택 → 16·32·64강 선택 → 1:1 대결 → 최종 결과 → 포토부스 순서로 진행합니다.
후보는 중복 ID 없이 랜덤 추첨하고 선택한 후보만 다음 라운드에 진출합니다.
게이지는 현재 라운드 기준으로 차며 다음 라운드에서 초기화됩니다. 선택 중에는 중복 입력을 막습니다.

명단은 `src/data/idols.ts`, 대표 사진은 `public/assets/idols/이름.jpg`에 있습니다.
파일명이 이름과 다르면 명단의 파일명 인자로 지정합니다.

- 남돌: 64명 대표 사진 연결 완료
- 여돌: 64명 대표 사진 연결 완료. 사진별 출처와 유형은 [사진 출처 목록](docs/GIRL_PHOTO_SOURCES.md) 참고
- `boy-1`, `girl-1` 등의 ID는 명단 순서로 생성되며 DB 통계의 키로도 사용됩니다. 기존 통계가 있다면 명단 순서를 임의로 바꾸지 않습니다.
- `getTournamentRoster`는 명단이 64명보다 적을 때 임시 후보를 채웁니다. 현재는 각 64명이므로 임시 후보가 생성되지 않습니다.

현재 결과·포토부스에서는 대표 사진인 `image`를 사용합니다. 데이터에 별도 `photo` 경로도 있으나 현재 화면에서는 사용하지 않습니다.

## 카메라 포토부스

결과 화면에서 사진 찍기 → 카메라 켜기 → 브라우저 권한 허용 → 네컷 촬영하기 순서입니다.
3·5·10초 타이머로 네 장을 자동 촬영하고 우승자 사진과 합성하여 이메일 첨부용 JPEG로 변환합니다.
사용자 영상과 저장 사진은 거울 방향이며 마이크는 요청하지 않습니다. 사진 업로드 기능은 없습니다.
프레임 색 변경, 다시 찍기, 카메라 오류 안내를 지원합니다.
화면을 나가거나 ESC로 처음으로 돌아가면 카메라·타이머를 종료하고 촬영 상태를 지웁니다.
촬영·합성은 브라우저에서 처리합니다. 이메일 전송 버튼을 누르면 완성 사진과 입력한 이메일 주소를 서버 API 및 Resend 메일 서비스에 전달합니다.
로컬에서는 `localhost`로 접속하고, 외부 주소에서 카메라를 사용하려면 HTTPS가 필요합니다.

### 카메라 없이 확인하기

개발 서버의 `/tests/camera-harness.html`에서 테스트 영상으로 촬영 흐름을 확인할 수 있습니다.
실제 카메라를 요청하지 않으며 배포 빌드에는 포함되지 않습니다.
`?mode=denied`, `?mode=missing`, `?mode=pending`으로 권한 거절·장치 없음·권한 응답 지연 상황을 확인합니다.
실제 전시용 장치의 카메라 권한과 화각은 해당 컴퓨터에서 확인해야 합니다.

## Firebase 통계 설정

앱 폴더에 `.env` 파일을 만들고 사용하는 Firebase 프로젝트의 값을 입력합니다.
이 파일은 Git에서 제외되어 있으므로 클론한 컴퓨터마다 따로 준비합니다.

```dotenv
VITE_FIREBASE_API_KEY=프로젝트의_설정값
VITE_FIREBASE_AUTH_DOMAIN=프로젝트의_설정값
VITE_FIREBASE_PROJECT_ID=프로젝트의_설정값
VITE_FIREBASE_STORAGE_BUCKET=프로젝트의_설정값
VITE_FIREBASE_MESSAGING_SENDER_ID=프로젝트의_설정값
VITE_FIREBASE_APP_ID=프로젝트의_설정값
VITE_FIREBASE_DATABASE_URL=실제_Realtime_Database_URL
```

변경 후 개발 서버를 다시 실행합니다. `databaseURL`을 생략하면 Firebase SDK가 프로젝트의 기본 주소를 사용합니다.
Firebase 설정이 없거나 초기화에 실패하면 DB 기능을 건너뛰며 게임·카메라 화면은 계속 실행됩니다.
실제 저장·조회에는 해당 DB의 접근 규칙이 요청을 허용해야 합니다.

- 결승 우승 시 `idols/{아이돌ID}/wins`를 1 증가시킵니다. 개별 대결 승리 횟수는 집계하지 않습니다.
- DB 기록 실패는 콘솔에 표시하며 게임 진행을 막지 않습니다.
- `getRanking`은 우승 횟수 내림차순 조회 함수입니다. 순위 화면은 아직 연결하지 않았습니다.
- 이름·그룹 등 DB의 초기 인물 정보는 별도 등록 대상입니다. 앱 명단만 수정해도 DB의 기존 인물 정보가 자동 갱신되지는 않습니다.

초기 등록 스크립트는 다음과 같습니다. 이 스크립트는 `.env`의 `VITE_FIREBASE_PROJECT_ID`로 기본 미국 리전 주소를 조합하므로, 실제 DB 주소가 다르면 스크립트의 주소 처리부터 수정해야 합니다.

```sh
node --experimental-strip-types scripts/seed-idols.mjs
```

기존 데이터가 있으면 중단합니다. `--force` 옵션은 기존 `idols` 전체를 덮어쓰고 우승 횟수를 0으로 초기화하므로 기존 통계 유지용으로 사용하지 않습니다.

## 폴더 구조

```text
pickmystars/
├── api/photo-email.mjs   # 이메일 전송 서버 API
├── public/assets/         # 로고, SVG 배경, 아이돌 사진
├── scripts/seed-idols.mjs # DB 초기 인물 데이터 등록
├── src/
│   ├── components/       # 공통 화면 컴포넌트
│   ├── data/idols.ts     # 이름, 그룹, ID, 사진 경로
│   ├── game/             # 랜덤 추첨과 토너먼트 로직
│   ├── hooks/            # 카메라·촬영 상태 관리
│   ├── lib/              # Firebase 초기화, 우승 기록·조회
│   ├── pages/            # 메인, 대결, 결과, 포토부스
│   ├── photo/            # 촬영 순서와 Canvas 합성
│   ├── state/            # 공유 상태와 타입
│   ├── styles/           # 화면 스타일
│   └── App.tsx           # 게임 상태와 화면 전환
└── tests/                # 자동 테스트와 카메라 테스트 화면
```

`node_modules/`, `dist/`, `.env`는 Git에 올리지 않습니다.

## 사진 이메일 전송 설정

사진 저장 버튼 대신 **이메일로 전송하기 → 주소 입력 → 이 주소로 전송하기**를 사용합니다.
전송 중에는 중복 클릭을 막고, 실패 시 주소 수정·재시도가 가능합니다. 화면 이탈 시 주소와 전송 UI 상태를 지웁니다.
성공 안내는 메일 서비스가 요청을 수락했다는 뜻이며, 최종 수신을 보장하지는 않습니다.

1. Resend 계정에서 발신 도메인을 인증하고 API 키를 발급합니다.
2. `.env.example`을 참고해 앱 폴더의 `.env`에 서버 전용 값을 넣습니다.

```dotenv
RESEND_API_KEY=발급받은_API_키
PHOTO_EMAIL_FROM=인증된_도메인의_발신주소
```

이 값에는 `VITE_` 접두사를 붙이지 않습니다. 브라우저 코드에 API 키를 넣지 않습니다.
로컬에서는 개발 서버를 재시작하면 Vite 미들웨어가 `/api/photo-email`을 처리합니다.
Vercel에서는 Root Directory를 `pickmystars`로 지정하고 위 환경 변수를 등록하면 `api/photo-email.mjs`가 서버 함수로 실행됩니다.
`npm run preview`나 정적 파일 호스팅만으로는 이메일 API가 실행되지 않습니다.

완성 사진은 가로 640px JPEG로 압축해 첨부하며, 요청 크기는 3MB로 제한합니다.
API는 서버 파일이나 Firebase에 주소·사진을 저장하지 않습니다. 메일 서비스에서는 발송 처리·보관 정책이 적용됩니다.
메일 설정이 없으면 전송 실패 안내를 표시하며, 성공으로 처리하지 않습니다.

같은 사진과 수신 주소로 재시도할 때 Resend 중복 방지 키를 사용합니다.
동일 출처 확인과 프로세스 내 분당 5회 제한은 전시 PC의 반복 요청을 줄이기 위한 기본 장치입니다.
불특정 다수에게 공개할 때는 공유 저장소 기반 요청 제한과 봇 방지 등을 추가해야 합니다. 현재 제한은 여러 서버 인스턴스에 공유되지 않습니다.

자동 테스트는 외부 발송 없이 서비스 응답을 대체해 검증합니다. 실제 메일 발송·수신은 운영 설정 후 별도 확인이 필요합니다.

## Netlify 배포 (GitHub 연결 없이)

`pickmystars` 폴더에서 진행합니다. `netlify.toml`이 화면 빌드와 Functions 번들링을 설정하고,
`netlify/functions/photo-email.mjs`가 기존 `/api/photo-email` 주소를 처리합니다.
기존 로컬 개발 및 Vercel API도 계속 사용할 수 있습니다.

```sh
npx netlify-cli login
npx netlify-cli deploy
```

처음에는 새 Netlify 사이트를 생성하거나, 이미 Drop으로 올린 사이트가 있으면 그 사이트에 연결합니다.
GitHub 저장소 생성·연결은 필요하지 않습니다. 기본 배포는 확인용 주소를 만듭니다.

Netlify 사이트의 **Project configuration → Environment variables**에
`RESEND_API_KEY`, `PHOTO_EMAIL_FROM`을 등록합니다. 범위를 선택할 수 있다면 **Functions**를 포함하고,
실제 사용할 배포 환경에도 적용합니다. 로컬 `.env`만 작성해 두어도 배포 서버에 자동 등록되지는 않습니다.
Firebase를 사용한다면 `VITE_FIREBASE_…` 값도 빌드 환경에 등록합니다.
키는 소스 코드나 GitHub에 올리지 않습니다. 환경 변수 변경 후 다시 배포합니다.

```sh
npx netlify-cli deploy --prod
```

이 명령은 앱을 빌드하고 정적 파일과 이메일 함수를 함께 업로드합니다.
`dist` 폴더만 Netlify Drop에 끌어다 올리면 서버 함수는 배포되지 않으므로 이메일 전송은 작동하지 않습니다.
실제 발송에는 Resend 발신 주소 설정이 필요하며, 테스트 발신 주소는 본인 계정 이메일 수신 확인용입니다.
배포 주소에서 카메라 촬영 → 이메일 전송 → 수신 확인을 진행합니다.

참고: [Netlify CLI 배포](https://cli.netlify.com/commands/deploy/),
[Functions API](https://docs.netlify.com/build/functions/api/).

## 방명록

메인의 ‘방명록 보기’ 또는 포토부스의 ‘한마디 남기기’로 이동합니다.
닉네임은 선택이며 비워두면 ‘익명’으로 표시됩니다. 닉네임 20자, 내용 150자까지 입력할 수 있습니다.
최종 우승자가 있는 경우 작성한 글에 해당 아이돌 이름을 함께 표시합니다.
최신순으로 4개씩 조회하고 페이지를 이동할 수 있습니다.
현재 저장소는 해당 사이트의 브라우저 localStorage입니다. 새로고침 후에도 유지되지만
다른 기기·브라우저·다른 도메인과 공유되지 않고 사이트 데이터 삭제 시 사라집니다.
Firebase 방명록 공유 및 운영자 삭제는 아직 구현하지 않았습니다.
