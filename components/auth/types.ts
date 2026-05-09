export type Step = 1 | 2 | 3 | 4;
export type PayType = "full" | "scholarship";

export interface CourseItem {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  price: number;
}
