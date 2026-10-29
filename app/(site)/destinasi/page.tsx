import Link from "next/link"
import { ArrowLeft, Compass, MapPinned, Mountain } from "lucide-react"
import DestinationsExplorer from "@/components/destinations-explorer"
import { getPublicHikingDestinations } from "@/lib/hiking-source"

export const metadata = {
  title: "Destinasi Pendakian Jawa Barat | Akasha Outdoor",
  description: "Cari gunung di Jawa Barat, jelajahi peta Google My Maps, dan periksa referensi cuaca BMKG sebelum merencanakan pendakian.",
  openGraph: {
    title: "Destinasi Pendakian Jawa Barat | Akasha Outdoor",
    description: "Jelajahi daftar gunung, peta sumber, dan ringkasan cuaca wilayah yang tersedia.",
  },
}

export default function DestinationsPage() {
  const destinations = getPublicHikingDestinations()
  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border/60 bg-secondary/25 px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-3.5" /> Beranda</Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl"><span className="section-eyebrow"><Compass className="size-3.5" /> Destinasi pendakian</span><h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">Jelajahi gunung <span className="font-display font-normal italic text-primary">Jawa Barat.</span></h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Temukan lokasi, peta rujukan, dan cuaca wilayah tanpa harus melewati halaman pembuka yang panjang.</p></div>
            <div className="flex items-center gap-2 self-start rounded-full border border-border/70 bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground sm:self-auto"><Mountain className="size-3.5 text-primary" />{destinations.length} entri destinasi <span className="mx-1 h-3.5 w-px bg-border" /><MapPinned className="size-3.5 text-primary" />Peta interaktif</div>
          </div>
        </div>
      </header>
      <DestinationsExplorer initialMountains={destinations} />
    </div>
  )
}
