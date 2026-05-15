// 📁 SAVE AS: src/app/robots.ts

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"], // Keeps bots out of your backend routes
    },
    sitemap: "https://quizai.dev/sitemap.xml",
  };
}
