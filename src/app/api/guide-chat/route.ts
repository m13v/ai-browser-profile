import { createGuideChatHandler } from "@seo/components/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createGuideChatHandler({
  app: "ai-browser-profile",
  brand: "AI Browser Profile",
  siteDescription:
    "npm package that extracts user identity (emails, accounts, addresses) from browser data into a self-ranking SQLite database. Installs as a Claude Code skill.",
  contentDir: "src/app/(content)/t",
});
