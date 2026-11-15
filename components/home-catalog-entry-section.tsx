import Link from "next/link"
import {
  ArrowUpRight,
  PackageCheck,
  ShoppingBag,
  Tent,
} from "lucide-react"
import ScrollReveal from "@/components/scroll-reveal"

const ENTRY_POINTS = [
  {
    icon: Tent,
    title: "Sewa satuan",
    detail: "Perlengkapan pilihan",
    filter: "rental",
  },
  {
    icon: PackageCheck,
    title: "Paket camping",
    detail: "Pilihan lebih praktis",
    filter: "package",
  },
  {
    icon: ShoppingBag,
    title: "Produk outdoor",
    detail: "Pilihan untuk dibeli",
    filter: "sale",
  },
]

export default function HomeCatalogEntrySection() {
  return (
    <section
      id="katalog"
      aria-labelledby="home-catalog-title"
      className="scroll-mt-24 px-4 py-7 sm:px-6 sm:py-9 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="flex items-end justify-between gap-3">
            <div>
              <span className="section-eyebrow">Akasha Smart Booking</span>
              <h2
                id="home-catalog-title"
                className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
              >
                Pilih kebutuhan Anda.
              </h2>
            </div>
            <Link
              href="/katalog"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-primary transition hover:bg-primary/8 sm:px-3 sm:text-xs"
            >
              Buka katalog <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
          {ENTRY_POINTS.map((entry, index) => (
            <ScrollReveal key={entry.title} delay={index * 0.055} className="h-full">
              <Link
                href={"/katalog?filter=" + entry.filter}
                className="home-catalog-entry group flex h-full min-h-[132px] flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-3 transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-black/[.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-[158px] sm:rounded-[1.35rem] sm:p-4 lg:p-5"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span className="home-catalog-entry-icon grid size-9 place-items-center rounded-xl bg-primary/10 text-primary transition duration-300 group-hover:scale-105 sm:size-10">
                    <entry.icon className="size-4.5 sm:size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground/70 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <span className="min-w-0">
                  <strong className="block text-[11px] leading-tight font-semibold tracking-tight sm:text-sm">
                    {entry.title}
                  </strong>
                  <span className="mt-1 block text-[9px] leading-tight text-muted-foreground sm:text-[11px]">
                    {entry.detail}
                  </span>
                </span>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
