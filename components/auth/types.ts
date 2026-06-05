import type { LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type LucideIcon = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

export type Step = 1 | 2 | 3 | 4;
export type PayType = "full" | "scholarship";

export interface CourseItem {
  id: string;
  name: string;
  icon: LucideIcon;
  desc: string;
  price: number;
}
