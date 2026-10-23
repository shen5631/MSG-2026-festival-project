export type Category = "boy" | "girl";
export type ScreenId = "home" | "play" | "result" | "photo" | "guestbook";

export interface Idol {
  id: string;
  demo?: boolean;
  name: string;
  group: string;
  image: string;
  photo?: string;
}

export const asset = (filename: string) =>
  `${import.meta.env.BASE_URL}assets/${filename}`;

// 교체한 사진은 운영체제별 한글 파일명 차이를 피하도록 영문 경로를 사용합니다.
const portraitFiles: Record<string, string> = {
  지우: "jiwoo",
  마키: "maki",
  마유카: "mayuka",
  민니: "minnie",
  민주_아일릿: "minju-illit",
  사쿠야: "sakuya",
  설윤: "sullyoon",
  슈화: "shuhua",
  신정환: "shinyu",
  아사: "asa",
  아이린: "irene",
  아현: "ahyeon",
  안유진: "an-yujin",
  양정원: "jungwon",
  예온: "yeon",
  오해원: "haewon",
  우기: "yuqi",
  윈터: "winter",
};

// 이미지는 public/assets/idols/ 에 "이름.jpg"(대표), "이름_우승사진.jpg"(우승 사진)로 저장합니다.
const portrait = (
  id: string,
  name: string,
  group: string,
  file = name,
): Idol => ({
  id,
  name,
  group,
  image: asset(`idols/${portraitFiles[file] ?? file}.jpg`),
  photo: asset(`idols/${file}_우승사진.jpg`),
});

const boyRoster: [name: string, group: string][] = [
  ["박건욱", "ZEROBASEONE"],
  ["한태산", "BOYNEXTDOOR"],
  ["릴러말즈", "래퍼"],
  ["변의주", "&TEAM"],
  ["하루아", "&TEAM"],
  ["최산", "ATEEZ"],
  ["텐", "NCT"],
  ["장규현", "AEN"],
  ["부승관", "SEVENTEEN"],
  ["예성", "SUPER JUNIOR"],
  ["리즈하오", "MODYSSEY"],
  ["후한원", ""],
  ["김운학", "BOYNEXTDOOR"],
  ["박성호", "BOYNEXTDOOR"],
  ["장하오", "앤더블"],
  ["동화", "KickFlip"],
  ["죠", "&TEAM"],
  ["케이", "&TEAM"],
  ["니콜라스", "&TEAM"],
  ["유마", "&TEAM"],
  ["타키", "&TEAM"],
  ["허중싱", ""],
  ["마키", "&TEAM"],
  ["박종성", "ENHYPEN"],
  ["양정원", "ENHYPEN"],
  ["유강민", "VERIVERY"],
  ["장한음", "솔로"],
  ["서정우", "AHOF"],
  ["요시", "TREASURE"],
  ["김명수", "INFINITE"],
  ["이경민", "TWS"],
  ["료", "NCT"],
  ["리쿠", "NCT"],
  ["사쿠야", "NCT"],
  ["김도훈", "TWS"],
  ["신정환", "TWS"],
  ["한지훈", "TWS"],
  ["카이", "EXO"],
  ["필릭스", "Stray Kids"],
  ["리노", "Stray Kids"],
  ["원빈", "RIIZE"],
  ["제노", "NCT"],
  ["재현", "NCT"],
  ["도경수", "EXO"],
  ["니키", "ENHYPEN"],
  ["제이크", "ENHYPEN"],
  ["우지", "SEVENTEEN"],
  ["이협", "DRIPPIN"],
  ["송은석", "RIIZE"],
  ["정성찬", "RIIZE"],
  ["김인후", "TUNEXX"],
  ["죠지", ""],
  ["성한빈", "ZEROBASEONE"],
  ["준", "SEVENTEEN"],
  ["우영", "ATEEZ"],
  ["빅나티", "래퍼"],
  ["정국", "BTS"],
  ["뷔", "BTS"],
  ["주훈", "CORTIS"],
  ["히카루", "aoen"],
  ["안건호", "CORTIS"],
  ["엄성현", "CORTIS"],
  ["김선우", "ENHYPEN"],
  ["박성훈", "ENHYPEN"],
];

const girlRoster: [name: string, group: string, file?: string][] = [
  ["리브", "리센느"],
  ["강해린", "뉴진스"],
  ["민지", "뉴진스"],
  ["카리나", "에스파"],
  ["윈터", "에스파"],
  ["원이", "리센느"],
  ["지우", "HEARTS2HEARTS"],
  ["스텔라", "HEARTS2HEARTS"],
  ["이안", "HEARTS2HEARTS"],
  ["장원영", "아이브"],
  ["설윤", "엔믹스"],
  ["안나", "MEOVV"],
  ["유나", "있지"],
  ["하늘", "키오프"],
  ["벨", "키오프"],
  ["방지민", "이즈나"],
  ["민주", "아일릿", "민주_아일릿"],
  ["미나미", "리센느"],
  ["오해원", "엔믹스"],
  ["유사랑", "이즈나"],
  ["최예나", "솔로"],
  ["츄", "솔로"],
  ["오아", "A2O LITE"],
  ["아이찡", "A2O LITE"],
  ["주은", "HEARTS2HEARTS"],
  ["크리스탈", "f(x)"],
  ["윤아", "소녀시대"],
  ["수지", "미쓰에이"],
  ["규리", "솔로"],
  ["제니", "블랙핑크"],
  ["지수", "블랙핑크"],
  ["로제", "블랙핑크"],
  ["아이유", "솔로"],
  ["아윤", "A2O LITE"],
  ["최정은", "이즈나"],
  ["마이", "이즈나"],
  ["영서", "ALLDAYPROJECT"],
  ["이현", "BABYDONTCRY"],
  ["아현", "BABYMONSTER"],
  ["아사", "BABYMONSTER"],
  ["치키타", "BABYMONSTER"],
  ["에이나", "HEARTS2HEARTS"],
  ["예온", "HEARTS2HEARTS"],
  ["원희", "아일릿"],
  ["민주", "(전)아이즈원", "민주_아이즈원"],
  ["나연", "트와이스"],
  ["슈화", "아이들"],
  ["민니", "아이들"],
  ["우기", "아이들"],
  ["리즈", "아이브"],
  ["이서", "아이브"],
  ["안유진", "아이브"],
  ["임서원", "(전)유니스"],
  ["키야", "키키"],
  ["이솔", "키키"],
  ["써머", "오드유스"],
  ["아이린", "레드벨벳"],
  ["니나", "니쥬"],
  ["마유카", "니쥬"],
  ["김채원", "르세라핌"],
  ["홍은채", "르세라핌"],
  ["사쿠라", "르세라핌"],
  ["허윤진", "르세라핌"],
  ["카즈하", "르세라핌"],
];

export const idols: Record<Category, Idol[]> = {
  boy: boyRoster.map(([name, group], index) =>
    portrait(`boy-${index + 1}`, name, group),
  ),
  girl: girlRoster.map(([name, group, file], index) =>
    portrait(`girl-${index + 1}`, name, group, file),
  ),
};

// 사진 수급 전 게임 검증용입니다. 실제 명단이 준비되면 임시 후보 대신 데이터를 추가합니다.
export function getTournamentRoster(category: Category): Idol[] {
  const originals = idols[category];
  return [
    ...originals,
    ...Array.from(
      { length: Math.max(0, 64 - originals.length) },
      (_, index) => ({
        id: `${category}-demo-${index + 1}`,
        name: `임시 후보 ${String(index + 1).padStart(2, "0")}`,
        group: "테스트용 · 기존 사진 재사용",
        image: originals[index % originals.length].image,
        demo: true,
      }),
    ),
  ];
}

export function getCompanionParticle(name: string): "과" | "와" {
  const last = name.at(-1) ?? "";
  if (/\d/.test(last)) return "013678".includes(last) ? "과" : "와";
  const code = last.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? "과" : "와";
}
