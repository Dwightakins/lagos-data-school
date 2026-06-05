import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lagos Data School Limited — Africa's Tech & Data Skills Academy",
  description:
    "Master data analysis, machine learning, and software engineering through expert-led courses built for Africa. Enroll now or apply for a scholarship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
