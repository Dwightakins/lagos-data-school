import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Apply for 97% Scholarship — Lagos Data School",
  description:
    "Pay only ₦8,000 instead of ₦250,000. Apply for our scholarship programme and start your tech career today.",
  openGraph: {
    title: "Apply for 97% Scholarship — Lagos Data School",
    description:
      "Pay only ₦8,000 instead of ₦250,000. Apply for our scholarship programme and start your tech career today.",
    url: "https://lagosdataschool.com/apply-scholarship",
  },
};

export default function ScholarshipLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
