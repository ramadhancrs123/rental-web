import Link from "next/link"
import { ArrowUpRight, CloudSun, Compass, MapPinned, Route } from "lucide-react"
import ScrollReveal from "@/components/scroll-reveal"
import HikingMap from "@/components/hiking-map"
import { type HikingMountain, requestHikingCatalog } from "@/lib/hiking"

const DESTINATION_FEATURES = [
  { icon: MapPinned, label: "Peta persebaran gunung Jawa Barat" },
  { icon: CloudSun, label: "Prakiraan wilayah BMKG" },
  { icon: Route, label: "Referensi akses dan jalur terpublikasi" },
]

export default async function DestinationsHighlight() {
  let mountains: HikingMountain[] = []
  try {
    const response = await requestHikingCatalog<HikingMountain>({ resource: "map", limit: 50, offset: 0 })
    mountains = response.items ?? []
  } catch {
    // Fail closed: no JSON or hard-coded map marker fallback.
  }

  return (
    <section id="destinasi" className="scroll-mt-24 border-y border-border/60 bg-secondary/30 px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:gap-10">
        <ScrollReveal>
          <div>
            <span className="section-eyebrow"><Compass className="size-3.5" /> Jelajahi destinasi</span>
            <h2 className="mt-4 max-w-xl text-3xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-4xl">Temukan gunung <span className="font-display font-normal italic text-primary">berikutnya.</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Mulai dari peta persebaran, lalu buka detail destinasi untuk melihat lokasi, jalur yang dipublikasikan, dan referensi cuaca.</p>
            <Link href="/destinasi" className="group mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Jelajahi semua destinasi <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <div className="mt-7 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
              {DESTINATION_FEATURES.map(({ icon: Icon, label }) => <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4.5" /></span><span className="text-xs leading-5 font-semibold text-foreground">{label}</span></div>)}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <HikingMap mountains={mountains} title="Peta persebaran destinasi pendakian Jawa Barat" frameClassName="h-[360px] sm:h-[420px] lg:h-[460px]" caption="Peta Maptoolkit Outdoor. Marker hanya berasal dari gunung dengan koordinat yang sudah dipublikasikan dalam database." />
        </ScrollReveal>
      </div>
    </section>
  )
}

