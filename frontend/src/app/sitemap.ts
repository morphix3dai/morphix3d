import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://morphix3d.vercel.app";

  const staticPages = [
    { url: baseUrl, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/login`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${baseUrl}/register`, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/pricing`, changeFrequency: "weekly" as const, priority: 0.9 },
  ];

  const workspacePages = [
    "text-to-3d",
    "image-to-3d",
    "texture",
    "remesh",
    "rig",
    "architecture",
    "mechanical",
  ].map((slug) => ({
    url: `${baseUrl}/workspace/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...workspacePages];
}
