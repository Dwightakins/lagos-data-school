import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Lagos Data School Limited — Nigeria's Tech & Data Skills Academy",
  description:
    "Master data analysis, machine learning, and software engineering through expert-led courses built for Nigeria. Enroll now or apply for a scholarship.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          <Script
            src="https://js.paystack.co/v1/inline.js"
            strategy="beforeInteractive"
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
