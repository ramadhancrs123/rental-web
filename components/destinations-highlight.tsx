import Link from "next/link"
import { ArrowUpRight, CloudSun, Compass, MapPinned, Route } from "lucide-react"
import ScrollReveal from "@/components/scroll-reveal"
import HomeDestinationsMap from "@/components/home-destinations-map"

const DESTINATION_FEATURES = [
  { icon: MapPinned, label: "Jelajahi gunung di Jawa Barat" },
  { icon: CloudSun, label: "Referensi prakiraan cuaca" },
  { icon: Route, label: "Informasi jalur pendakian" },
]

export default function DestinationsHighlight() {
  return (
    <section id="destinasi" className="scroll-mt-24 border-y border-border/60 bg-secondary/30 px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto grid max-w-7xl items-start gap-6 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:gap-8">
        <ScrollReveal>
          <div>
            <span className="section-eyebrow"><Compass className="size-3.5" /> Jelajahi destinasi</span>
            <h2 className="mt-3 max-w-xl text-2xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">Temukan gunung <span className="font-display font-normal italic text-primary">berikutnya.</span></h2>
            <p className="mt-3 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">Gunung, jalur pendakian, dan referensi cuaca dalam satu tempat.</p>
            <Link href="/destinasi" className="group mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Jelajahi semua destinasi <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <div className="mt-5 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {DESTINATION_FEATURES.map(({ icon: Icon, label }) => <div key={label} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4.5" /></span><span className="text-xs leading-5 font-semibold text-foreground">{label}</span></div>)}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <HomeDestinationsMap />
        </ScrollReveal>
      </div>
    </section>
  )
}
