export type Category = "boy" | "girl";
export type ScreenId = "home" | "play" | "result" | "photo";

export interface Idol {
  name: string;
  group: string;
  image: string;
}

export const asset = (filename: string) =>
  `${import.meta.env.BASE_URL}assets/${filename}`;

export const idols: Record<Category, Idol[]> = {
  boy: [
    { name: "서정우", group: "AHOF", image: asset("boy-2.jpg") },
    { name: "유강민", group: "VERIVERY", image: asset("boy-1.jpg") },
  ],
  girl: [
    { name: "스텔라", group: "Hearts2Hearts", image: asset("girl-1.jpg") },
    { name: "이안", group: "Hearts2Hearts", image: asset("girl-2.jpg") },
  ],
};
