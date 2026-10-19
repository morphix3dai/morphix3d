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
    sitemap: "https://3dmorphix.com/sitemap.xml",
    host: "https://3dmorphix.com",
  };
}
