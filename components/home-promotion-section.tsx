import {
  BadgePercent,
  HeartHandshake,
  Sparkles,
  Tag,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import ScrollReveal from "@/components/scroll-reveal"
import HomeInfoDialog from "@/components/home-info-dialog"
import { ShineBorder } from "@/components/ui/shine-border"
import type { HomeMarketingConfig } from "@/lib/home-marketing"

type HomePromotionSectionProps = {
  marketing: HomeMarketingConfig
}

type Program = {
  key: string
  icon: LucideIcon
  title: string
  summary: string
  description: string
}

export default function HomePromotionSection({
  marketing,
}: HomePromotionSectionProps) {
  const programs: Program[] = [
    {
      key: "catalog",
      icon: Tag,
      title: "Promo katalog",
      summary: "Cek penawaran perlengkapan",
      description:
        "Lihat harga dan penawaran yang tersedia pada perlengkapan maupun paket camping di katalog Akasha.",
    },
    ...(marketing.loyaltyProgramEnabled
      ? [
          {
            key: "loyalty",
            icon: HeartHandshake,
            title: "Pelanggan setia",
            summary: "Apresiasi pelanggan",
            description:
              "Pelanggan yang memenuhi ketentuan program dapat memperoleh apresiasi saat melakukan penyewaan di Akasha.",
          },
        ]
      : []),
    ...(marketing.checkoutManualDiscountEnabled
      ? [
          {
            key: "special",
            icon: BadgePercent,
            title: "Penawaran transaksi",
            summary: "Keuntungan tambahan",
            description:
              "Tanyakan kepada Tim Akasha mengenai penawaran yang tersedia untuk transaksi Anda.",
          },
        ]
      : []),
  ]

  return (
    <section
      id="program-akasha"
      aria-labelledby="home-promotion-title"
      className="home-promotion-section scroll-mt-24 px-4 py-7 sm:px-6 sm:py-9 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <span className="section-eyebrow"><Sparkles className="size-3.5" /> Program Akasha</span>
              <h2
                id="home-promotion-title"
                className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
              >
                Penawaran untuk Anda.
              </h2>
            </div>
            <Link
              href="/katalog"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold text-primary transition hover:bg-primary/8 sm:px-3 sm:text-xs"
            >
              Lihat katalog <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {programs.map((program, index) => (
            <ScrollReveal
              key={program.key}
              delay={index * 0.055}
              className={programs.length === 3 && index === 2 ? "col-span-2 h-full lg:col-span-1" : "h-full"}
            >
              <article className="home-program-card group relative isolate flex h-full min-h-[126px] flex-col gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/[.05] sm:min-h-[138px] sm:rounded-[1.35rem] sm:p-4">
                {index === 0 ? (
                  <ShineBorder
                    borderWidth={1}
                    duration={18}
                    shineColor={["#D88A50", "#FFE0B8", "#B96637"]}
                  />
                ) : null}
                <div className="relative z-10 flex w-full items-start justify-between gap-2">
                  <span className="home-program-icon grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition duration-300 group-hover:scale-105 sm:size-10">
                    <program.icon className="size-4.5 sm:size-5" strokeWidth={1.8} />
                  </span>
                  <HomeInfoDialog
                    title={program.title}
                    description={program.description}
                  />
                </div>
                <div className="relative z-10 min-w-0">
                  <h3 className="text-[11px] leading-tight font-semibold tracking-tight sm:text-sm">{program.title}</h3>
                  <p className="mt-1 text-[9px] leading-snug text-muted-foreground sm:text-xs">{program.summary}</p>
                  {program.key === "catalog" ? (
                    <Link href="/katalog" className="mt-2 inline-flex text-[10px] font-semibold text-primary underline-offset-4 hover:underline">
                      Jelajahi <span className="ml-1" aria-hidden="true">↗</span>
                    </Link>
                  ) : null}
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
