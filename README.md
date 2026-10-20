# P!ck My St☆r

2026 MSG 관악구 청아즐 페스티벌 전시 부스를 위한 아이돌 이상형 월드컵 웹앱입니다.

## 현재 구현

- 남자·여자 아이돌 카테고리 선택
- 16강·32강·64강 랜덤 대진, 승자 진출, 라운드별 진행 게이지
- 최종 우승자 결과와 포토부스 연결
- 익명 방명록 작성·조회 및 Firebase 실시간 공유
- 웹캠 네컷 촬영, 3·5·10초 타이머, 프레임 색 변경, 다시 찍기, 이메일 전송 요청

## 시작하기
[배포 링크](https://pickmystar.netlify.app/)

Node.js 22.12 이상과 npm이 필요합니다. 저장소를 클론한 뒤 **`pickmystars` 폴더에서** 실행합니다.

```sh
cd pickmystars
npm install
npm run dev
```

터미널에 표시되는 주소를 엽니다. 기본 주소는 `http://localhost:5173`이며, 포트가 사용 중이면 달라질 수 있습니다.
실행 중에는 터미널을 열어 두고, 종료할 때는 `Ctrl + C`를 누릅니다. React 프로젝트이므로 HTML 파일을 직접 열거나 Live Server로 실행하지 않습니다.

빌드, 검사, Firebase 설정과 폴더 구조는 [앱 README](pickmystars/README.md)를 참고하세요.

## 남은 작업

- 전시 화면에서 아이돌 사진 크롭·화질 최종 확인
- Gmail 계정·앱 비밀번호 설정 후 실제 메일 수신 확인

- 전시용 컴퓨터에서 카메라 권한·화각·반복 사용 점검

## Netlify 배포

GitHub 연결 없이 `pickmystars` 폴더에서 Netlify CLI로 화면과 이메일 API를 함께 배포할 수 있습니다.
환경 변수 등록 및 배포 순서는 [앱 개발 안내](pickmystars/README.md#netlify-배포-github-연결-없이)를 참고하세요.
`dist` 폴더만 Drop으로 업로드하면 이메일 API는 배포되지 않습니다.
