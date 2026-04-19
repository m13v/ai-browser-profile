import type { NextConfig } from "next";
import { withSeoContent } from "@seo/components/next";

const nextConfig: NextConfig = {
  transpilePackages: ["@seo/components", "@m13v/seo-components"],
};

export default withSeoContent(nextConfig, { contentDir: "src/app/(content)/t" });
