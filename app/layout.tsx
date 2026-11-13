import { Inter, Instrument_Serif } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import "maplibre-gl/dist/maplibre-gl.css"
import "@maptoolkit/maplibre-logo-control/style.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Akasha Outdoor Rent | Rental Perlengkapan Outdoor Garut",
  description:
    "Rental perlengkapan camping dan pendakian di Garut. Jelajahi pilihan sewa satuan dan paket camping, ajukan penyewaan melalui Akasha Smart Booking, lalu pantau booking di portal pribadi.",
  keywords: "rental perlengkapan camping Garut, sewa alat camping Garut, sewa tenda Garut, paket camping Garut, Akasha Outdoor Rent",
  applicationName: "Akasha Smart Booking",
  appleWebApp: {
    capable: true,
    title: "Akasha",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/akasha-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/akasha-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Akasha Outdoor Rent | Rental Outdoor & Smart Booking",
    description:
      "Temukan perlengkapan camping dan pendakian di Garut. Pilih perlengkapan sewa atau paket camping, ajukan penyewaan, dan pantau booking melalui portal pribadi Akasha.",
    type: "website",
    locale: "id_ID",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e87516" },
    { media: "(prefers-color-scheme: dark)", color: "#111722" },
  ],
  colorScheme: "light dark",
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-display",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        inter.variable,
        instrumentSerif.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
