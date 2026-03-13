import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Startup Validation Plan",
  description: "Turn your startup idea into a 14-day validation plan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
