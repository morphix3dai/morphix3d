import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/assets/",
          "/settings/",
        ],
      },
    ],
    sitemap: "https://morphix3d.vercel.app/sitemap.xml",
    host: "https://morphix3d.vercel.app",
  };
}
