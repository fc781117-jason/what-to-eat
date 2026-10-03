import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return {
    name: "What To Eat?｜今天吃什麼",
    short_name: "今天吃什麼",
    description: "附近找店、比較餐廳、命運拉霸。",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#ff6b6b",
    orientation: "portrait",
    icons: [
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
  };
}
