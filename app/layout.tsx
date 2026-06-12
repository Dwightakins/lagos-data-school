import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://lagosdataschool.com"),
  title: {
    default: "Lagos Data School — Learn Data Analysis, Data Science & Tech Skills in Nigeria",
    template: "%s — Lagos Data School",
  },
  description:
    "Join Nigeria's leading tech academy. Live instructor-led training in Data Analysis, Data Science, Cybersecurity and more. 97% scholarships available. Enroll today.",
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Lagos Data School",
    images: [{ url: "/images/hero.jpg", width: 1200, height: 630, alt: "Lagos Data School" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/hero.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
          {children}
          <WhatsAppButton />
          <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
        </ThemeProvider>
      </body>
    </html>
  );
}
