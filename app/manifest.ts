import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Akasha Smart Booking — Akasha Outdoor",
    short_name: "Akasha",
    description: "Jelajahi perlengkapan camping dan pendakian, ajukan penyewaan, dan pantau booking melalui portal pribadi Akasha.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#f8fafc",
    theme_color: "#e87516",
    categories: ["shopping", "lifestyle"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/akasha-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/akasha-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/akasha-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
