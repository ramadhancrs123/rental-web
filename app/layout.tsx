import { Inter, Instrument_Serif } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import "maplibre-gl/dist/maplibre-gl.css"
import "@maptoolkit/maplibre-logo-control/style.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Akasha Outdoor Rent | Rental Perlengkapan Outdoor Garut",
  description:
    "Sewa tenda dan perlengkapan outdoor di Garut, Jawa Barat. Booking online, konfirmasi WhatsApp, dan toleransi pengembalian hingga 10 jam sesuai ketentuan rental.",
  keywords: "sewa tenda, rental outdoor, sewa alat camping, tracking pole, akasha outdoor rent",
  openGraph: {
    title: "Akasha Outdoor Rent | Petualanganmu Dimulai dari Sini",
    description:
      "Temukan perlengkapan outdoor, pilih tanggal sewa, ajukan booking online, dan kenali destinasi pegunungan Garut untuk perjalanan berikutnya.",
    type: "website",
    locale: "id_ID",
  },
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
