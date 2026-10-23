# P!ck My St☆r · 개발 안내

React + TypeScript + Vite 기반의 아이돌 이상형 월드컵·카메라 포토부스입니다.
방명록 실시간 공유와 최종 우승 횟수 저장에 Firebase Realtime Database를 사용하며, 별도 로그인 기능은 없습니다.

## 실행과 검사

이 README가 있는 `pickmystars` 폴더에서 실행합니다. Node.js 24를 권장하며 최소 22.12 이상이 필요합니다. Netlify도 Node.js 24로 빌드합니다.

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
npm run format
npm run format:check
```

- `npm test`: 월드컵 진행·입력 검증, 촬영 순서·취소·크롭 및 이메일 API 관련 자동 테스트 28개
- `npm run typecheck`: TypeScript 검사
- `npm run build`: 타입 검사 후 `dist/`에 배포용 파일 생성
- `npm run preview`: 빌드 결과를 로컬에서 확인. 이메일 API는 실행하지 않습니다. 주소는 터미널 출력 참고

- `npm run format`: Prettier로 코드·문서 정리
- `npm run format:check`: 포맷 검사

패치를 받거나 브랜치를 바꾼 후 패키지를 찾지 못하면 `npm install` 후 개발 서버를 다시 켭니다.

## 화면 경로

`/` 메인, `/play` 대결, `/result` 결과, `/photo` 촬영, `/guestbook` 방명록으로 구성합니다.
게임과 촬영 상태는 메모리에 있어 새로고침하면 사라집니다. 진행 정보 없이 대결·결과·촬영 경로로 직접 들어오면 처음 화면으로 이동합니다.
ESC도 처음 화면으로 돌아갑니다. 방명록 글과 우승 횟수는 Firebase에 저장합니다.

## 월드컵과 아이돌 데이터

남돌·여돌 선택 → 16·32·64강 선택 → 1:1 대결 → 최종 결과 → 포토부스 순서로 진행합니다.
후보는 중복 ID 없이 랜덤 추첨하고 선택한 후보만 다음 라운드에 진출합니다.
게이지는 현재 라운드 기준으로 차며 다음 라운드에서 초기화됩니다. 선택 중에는 중복 입력을 막습니다.

명단과 경로는 `src/data/idols.ts`, 대표 사진은 `public/assets/idols/`에 있습니다.
교체한 18명 사진은 `portraitFiles`에서 영문 파일명으로 연결합니다. 예: `지우: "jiwoo"` → `jiwoo.jpg`.
영문 매핑이 없는 후보는 명단의 파일명 인자 또는 이름으로 사진을 찾습니다.
새 사진도 영문 파일명을 사용하면 macOS 한글 파일명 정규화 차이로 이미지가 로딩되지 않는 문제를 피할 수 있습니다.
사진 교체 후 `portraitFiles` 매핑도 함께 수정합니다.

카테고리 카드에는 호버·클릭 이동 효과와 선택 테두리가 있고, 강수 선택 배경은 좌우로 부드럽게 이동합니다.

- 남돌: 64명 대표 사진 연결 완료
- 여돌: 64명 대표 사진 연결 완료. 기존 수집 기록은 [사진 출처 목록](docs/GIRL_PHOTO_SOURCES.md) 참고. 이후 수동 교체한 사진은 출처 기록과 일치하는지 별도 확인이 필요합니다.
- `boy-1`, `girl-1` 등의 ID는 명단 순서로 생성되며 DB 통계의 키로도 사용됩니다. 기존 통계가 있다면 명단 순서를 임의로 바꾸지 않습니다.
- `getTournamentRoster`는 명단이 64명보다 적을 때 임시 후보를 채웁니다. 현재는 각 64명이므로 임시 후보가 생성되지 않습니다.

현재 결과·포토부스에서는 대표 사진인 `image`를 사용합니다. 데이터에 별도 `photo` 경로도 있으나 현재 화면에서는 사용하지 않습니다.

## 카메라 포토부스

결과 화면에서 사진 찍기 → 카메라 켜기 → 브라우저 권한 허용 → 네컷 촬영하기 순서입니다.
3·5·10초 타이머로 네 장을 자동 촬영하고 우승자 사진과 합성하여 이메일 첨부용 JPEG로 변환합니다.
사용자 영상과 저장 사진은 거울 방향이며 마이크는 요청하지 않습니다. 사진 업로드 기능은 없습니다.
프레임 색 변경, 다시 찍기, 카메라 오류 안내를 지원합니다.
화면을 나가거나 ESC로 처음으로 돌아가면 카메라·타이머를 종료하고 촬영 상태를 지웁니다.
촬영·합성은 브라우저에서 처리합니다. 이메일 전송 버튼을 누르면 완성 사진과 입력한 이메일 주소를 서버 API 및 설정한 메일 서비스에 전달합니다.
로컬에서는 `localhost`로 접속하고, 외부 주소에서 카메라를 사용하려면 HTTPS가 필요합니다.

### 카메라 없이 확인하기

개발 서버의 `/tests/camera-harness.html`에서 테스트 영상으로 촬영 흐름을 확인할 수 있습니다.
실제 카메라를 요청하지 않으며 배포 빌드에는 포함되지 않습니다.
`?mode=denied`, `?mode=missing`, `?mode=pending`으로 권한 거절·장치 없음·권한 응답 지연 상황을 확인합니다.
실제 전시용 장치의 카메라 권한과 화각은 해당 컴퓨터에서 확인해야 합니다.

## Firebase 방명록·통계 설정

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
Firebase 설정이 없거나 초기화에 실패해도 게임·카메라는 실행되지만 방명록 저장·조회와 우승 기록은 사용할 수 없습니다.
`VITE_` 값은 클라이언트 빌드에 포함되므로 DB 접근 권한은 Firebase 규칙으로 관리합니다.
실제 저장·조회에는 해당 DB의 접근 규칙이 요청을 허용해야 합니다.

- 방명록은 `guestbook/{id}`에 저장하고 실시간으로 구독합니다.
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
│   ├── guestbook/        # 방명록 검증·Firebase 저장과 구독
│   ├── hooks/            # 카메라·촬영 상태 관리
│   ├── lib/              # Firebase 초기화, 우승 기록·조회
│   ├── pages/            # 메인, 대결, 결과, 포토부스, 방명록
│   ├── photo/            # 촬영 순서와 Canvas 합성
│   ├── state/            # 공유 상태와 타입
│   ├── styles/           # 화면 스타일
│   └── App.tsx           # 게임 상태와 화면 전환
└── tests/                # 자동 테스트와 카메라 테스트 화면
```

`node_modules/`, `dist/`, `.env`는 Git에 올리지 않습니다.

## 사진 이메일 전송 설정

로컬 `.env`에 다음 Gmail 항목을 추가합니다. `.env.example`에는 실제 비밀번호를 넣지 않습니다.

사진 저장 버튼 대신 **이메일로 전송하기 → 주소 입력 → 이 주소로 전송하기**를 사용합니다.
전송 중에는 중복 클릭을 막고, 실패 시 주소 수정·재시도가 가능합니다. 화면 이탈 시 주소와 전송 UI 상태를 지웁니다.
성공 안내는 메일 서비스가 요청을 수락했다는 뜻이며, 최종 수신을 보장하지는 않습니다.

1. 발송용 Google 계정에서 2단계 인증을 설정하고 앱 비밀번호를 발급합니다.
2. 로컬 `.env`와 Netlify 환경 변수에 아래 값을 입력합니다.

```dotenv
MAIL_PROVIDER=gmail
GMAIL_USER=발송할_Gmail_주소
GMAIL_APP_PASSWORD=발급받은_앱_비밀번호
```

일반 로그인 비밀번호가 아니라 앱 비밀번호를 사용합니다. 복사한 값에 공백이 있어도 제거해서 처리합니다.
이 설정에는 `VITE_` 접두사를 붙이지 않습니다. 키와 비밀번호는 브라우저 코드·GitHub·채팅에 올리지 않습니다.
로컬에서는 개발 서버를 재시작하면 Vite가 `/api/photo-email`을 처리합니다.
Netlify는 환경 변수 저장 후 `npx netlify deploy --build --prod`로 다시 배포합니다.
Vercel에서도 동일 서버 API를 사용할 수 있습니다. `npm run preview`나 정적 파일 업로드만으로는 API가 실행되지 않습니다.

Gmail 모드는 도메인 인증 없이 `GMAIL_USER` 주소에서 완성 사진을 발송합니다.
JPEG 첨부는 가로 640px로 압축하며 요청 크기는 3MB로 제한합니다.
API는 주소·사진을 서버 파일이나 Firebase에 저장하지 않으며 메일 서비스의 처리·보관 정책은 적용됩니다.
Gmail 인증 실패, 수신 거절, 네트워크 오류는 성공으로 처리하지 않습니다.
기본 동일 출처 검사와 프로세스 내 IP별 분당 5회 제한을 유지합니다. 여러 서버에 공유되는 제한은 아닙니다.
Gmail 모드에는 서버 간 중복 방지가 없으므로 전송 결과가 불확실하면 메일함을 확인한 뒤 재시도합니다.

Resend를 계속 쓸 경우에만 `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `PHOTO_EMAIL_FROM`을 설정합니다.
Resend 모드에는 도메인 인증 및 테스트 수신자 제한이 적용되며, 같은 사진·주소의 요청에 중복 방지 키를 사용합니다.

테스트는 실제 발송 없이 SMTP·메일 서비스 응답을 대체해 검증합니다.
실제 계정 설정 후 로컬과 Netlify 양쪽에서 다른 이메일 주소로 수신되는지 확인해야 합니다.

## Netlify 배포

`pickmystars` 폴더에서 진행합니다. `netlify.toml`이 화면 빌드와 Functions 번들링을 설정하고,
`netlify/functions/photo-email.mjs`가 기존 `/api/photo-email` 주소를 처리합니다.
기존 로컬 개발 및 Vercel API도 계속 사용할 수 있습니다.

```sh
npx netlify login
npx netlify link
npx netlify deploy --build
```

처음에는 `netlify link`로 기존 사이트에 연결합니다. 새 사이트가 필요한 경우 CLI의 사이트 생성 안내를 따릅니다.
GitHub 저장소 생성·연결은 필요하지 않습니다. 기본 배포는 확인용 주소를 만듭니다.

Netlify 사이트의 **Project configuration → Environment variables**에
`MAIL_PROVIDER=gmail`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`를 등록합니다. 범위를 선택할 수 있다면 **Functions**를 포함하고,
실제 사용할 배포 환경에도 적용합니다. 로컬 `.env`만 작성해 두어도 배포 서버에 자동 등록되지는 않습니다.
Firebase를 사용한다면 `VITE_FIREBASE_…` 값도 빌드 환경에 등록합니다.
키는 소스 코드나 GitHub에 올리지 않습니다. 환경 변수 변경 후 다시 배포합니다.

```sh
git branch --show-current
git status --short
npx netlify deploy --build --prod
```

이 명령은 현재 체크아웃한 브랜치의 로컬 파일을 빌드하고 정적 파일과 이메일 함수를 함께 업로드합니다. GitHub main이 자동 선택되지는 않습니다.
`dist` 폴더만 Netlify Drop에 끌어다 올리면 서버 함수는 배포되지 않으므로 이메일 전송은 작동하지 않습니다.
Gmail 계정과 앱 비밀번호 설정 후 다른 이메일 주소로 실제 수신 여부를 확인합니다.
배포 주소에서 카메라 촬영 → 이메일 전송 → 수신 확인을 진행합니다.

참고: [Netlify CLI 배포](https://cli.netlify.com/commands/deploy/),
[Functions API](https://docs.netlify.com/build/functions/api/).

## 방명록

메인의 ‘방명록 보기’ 또는 포토부스의 ‘한마디 남기기’로 이동합니다.
닉네임은 선택이며 비워두면 ‘익명’으로 표시됩니다. 닉네임 20자, 내용 150자까지 입력할 수 있습니다.
최종 우승자가 있는 경우 작성한 글에 해당 아이돌 이름을 함께 표시합니다.
최신순으로 4개씩 조회하고 페이지를 이동할 수 있습니다.
글은 Firebase Realtime Database의 `guestbook/{id}` 에 저장되어 모든 기기에서 실시간으로 공유됩니다.
최근 300개까지 불러오며, 저장이 10초 안에 끝나지 않으면 실패로 안내하고 입력한 글은 유지합니다.
입력창은 패널의 남는 높이를 채우며 양쪽 하단 안내 문구를 같은 높이로 배치합니다.
운영자 삭제 화면은 아직 구현하지 않았습니다. 삭제는 Firebase 콘솔에서 해당 글을 지워주세요.

## Gmail 계정 준비

1. [Google 계정 보안](https://myaccount.google.com/security)에서 2단계 인증 설정
2. [앱 비밀번호](https://myaccount.google.com/apppasswords)에서 전시용 비밀번호 발급
3. 위 Gmail 환경 변수 입력 후 로컬 서버 재시작 및 Netlify 재배포
4. 다른 이메일로 사진 발송·수신과 스팸함 확인

계정 정책에 따라 앱 비밀번호가 제공되지 않을 수 있습니다. 전시가 끝나면 전시용 앱 비밀번호를 삭제할 수 있습니다.
하루 행사라도 Gmail 발송 제한은 적용됩니다. 개인 Gmail은 하루 500통 초과 등으로 일시 제한될 수 있으며,
이는 보장된 발송 가능량이 아닙니다. Google 보안 정책이 배포 서버의 접속을 제한할 수도 있으므로 실제 환경에서 사전 확인합니다.

참고: [앱 비밀번호](https://support.google.com/mail/answer/185833),
[Gmail 발송 제한](https://support.google.com/mail/answer/22839),
[Nodemailer Gmail 안내](https://nodemailer.com/guides/using-gmail).

## 최근 검증 범위

- 전체 128명 대표 사진의 로컬 HTTP JPEG 응답 확인
- 브라우저에서 16강 15경기 → 최종 결과 → 포토부스 진입 확인
- 타입 검사·프로덕션 빌드 및 자동 테스트 28개 통과

위 검증에는 카메라 실촬영과 실제 이메일 발송이 포함되지 않습니다.
전시용 컴퓨터에서 배포 사이트의 카메라·사진 수신·Firebase 방명록 공유를 별도로 확인합니다.
