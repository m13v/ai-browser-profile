import type { Metadata } from "next";
import "./globals.css";
import { SeoComponentsStyles } from "@seo/components/server";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-browser-profile.m13v.com"),
  title: {
    default: "AI Browser Profile — Extract Identity from Browser Data",
    template: "%s | AI Browser Profile",
  },
  description:
    "npm package that extracts user identity (emails, accounts, addresses) from browser data into a self-ranking SQLite database. Installs as a Claude Code skill.",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <SeoComponentsStyles />
      </head>
      <body className="bg-white text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
