import type { Metadata } from "next";
import "./globals.css";
import { SeoComponentsStyles } from "@seo/components/server";
import { HeadingAnchors } from "@seo/components";
import { SiteSidebar } from "@/components/site-sidebar";
import { GuideChat } from "@/components/guide-chat";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-browser-profile.m13v.com"),
  title: {
    default: "AI Browser Profile, Extract Identity from Browser Data",
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
      <body className="bg-white text-zinc-900 antialiased">
        <div className="flex min-h-screen">
          <SiteSidebar />
          <main className="flex-1 min-w-0">
            <HeadingAnchors />
            {children}
          </main>
          <GuideChat />
        </div>
      </body>
    </html>
  );
}
