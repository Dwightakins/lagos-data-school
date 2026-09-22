import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Apply for 94% Scholarship — Lagos Data School",
  description:
    "Get 94% off your course fee. Apply for our scholarship programme and start your tech career today.",
  openGraph: {
    title: "Apply for 94% Scholarship — Lagos Data School",
    description:
      "Get 94% off your course fee. Apply for our scholarship programme and start your tech career today.",
    url: "https://lagosdataschoolltd.com/apply-scholarship",
  },
};

export default function ScholarshipLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
