export type Category = "boy" | "girl";
export type ScreenId = "home" | "play" | "result" | "photo";

export interface Idol {
  id: string;
  demo?: boolean;
  name: string;
  group: string;
  image: string;
}

export const asset = (filename: string) =>
  `${import.meta.env.BASE_URL}assets/${filename}`;

export const idols: Record<Category, Idol[]> = {
  boy: [
    {
      id: "boy-jeongwoo",
      name: "서정우",
      group: "AHOF",
      image: asset("boy-2.jpg"),
    },
    {
      id: "boy-kangmin",
      name: "유강민",
      group: "VERIVERY",
      image: asset("boy-1.jpg"),
    },
  ],
  girl: [
    {
      id: "girl-stella",
      name: "스텔라",
      group: "Hearts2Hearts",
      image: asset("girl-1.jpg"),
    },
    {
      id: "girl-ian",
      name: "이안",
      group: "Hearts2Hearts",
      image: asset("girl-2.jpg"),
    },
  ],
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
