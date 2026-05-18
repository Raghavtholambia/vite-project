import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Examino — JEE & NEET Practice Platform",
  description: "AI-powered test generation and grading for JEE & NEET aspirants.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
