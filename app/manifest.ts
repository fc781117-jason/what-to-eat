import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "What To Eat?｜今天吃什麼",
    short_name: "今天吃什麼",
    description: "附近找店、比較餐廳、命運拉霸。",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7ed",
    theme_color: "#ff6b6b",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ],
  };
}
