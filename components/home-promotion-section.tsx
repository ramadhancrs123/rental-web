import Image from "next/image"
import Link from "next/link"
import {
  ArrowUpRight,
  BadgePercent,
  Clock3,
  HeartHandshake,
  PackageCheck,
  Sparkles,
} from "lucide-react"
import ScrollReveal from "@/components/scroll-reveal"
import {
  formatToleranceHours,
  type FeaturedOffer,
  type HomeMarketingConfig,
} from "@/lib/home-marketing"

type HomePromotionSectionProps = {
  featuredOffer: FeaturedOffer | null
  marketing: HomeMarketingConfig
  checkoutDiscountHref: string
}

export default function HomePromotionSection({
  featuredOffer,
  marketing,
  checkoutDiscountHref,
}: HomePromotionSectionProps) {
  const benefits = [
    marketing.loyaltyProgramEnabled
      ? {
          key: "loyalty",
          icon: HeartHandshake,
          title: "Apresiasi pelanggan setia",
          meta: null,
        }
      : null,
    marketing.checkoutManualDiscountEnabled
      ? {
          key: "checkout",
          icon: BadgePercent,
          title: "Diskon transaksi minimum",
          meta: "Kebijakan manual Tim Akasha",
          href: checkoutDiscountHref,
        }
      : null,
    marketing.toleranceHours
      ? {
          key: "tolerance",
          icon: Clock3,
          title:
            "Toleransi pengembalian " +
            formatToleranceHours(marketing.toleranceHours) +
            " jam",
          meta: null,
        }
      : null,
  ].filter((benefit) => benefit !== null)

  return (
    <section
      id="keuntungan-akasha"
      aria-labelledby="home-promotion-title"
      className="home-promotion-section scroll-mt-24 px-4 py-7 sm:px-6 sm:py-9 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <h2
              id="home-promotion-title"
              className="text-lg leading-tight font-semibold tracking-tight sm:text-xl"
            >
              <Sparkles className="mr-1.5 inline size-4 text-primary" />
              Keuntungan Akasha
            </h2>
            <span className="hidden text-[10px] font-medium text-muted-foreground sm:inline">
              Untuk setiap perjalanan
            </span>
          </div>
        </ScrollReveal>

        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.44fr)] lg:gap-3">
          <ScrollReveal>
            <Link
              href="/katalog"
              aria-label={
                featuredOffer
                  ? "Lihat penawaran " + featuredOffer.name + " di katalog"
                  : "Jelajahi katalog Akasha"
              }
              className="home-promotion-feature group relative flex min-h-[7.4rem] items-center justify-between gap-3 overflow-hidden rounded-2xl border border-white/10 px-4 py-3.5 text-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none sm:min-h-[8.1rem] sm:rounded-[1.35rem] sm:px-5"
            >
              {featuredOffer?.imageUrl ? (
                <Image
                  src={featuredOffer.imageUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 36vw"
                  className="home-promotion-image object-cover"
                />
              ) : (
                <span
                  className="home-promotion-fallback absolute inset-0"
                  aria-hidden="true"
                />
              )}
              <span
                className="home-promotion-scrim absolute inset-0"
                aria-hidden="true"
              />
              <span
                className="home-promotion-glow absolute inset-0"
                aria-hidden="true"
              />

              <span className="relative z-10 min-w-0">
                <span className="block text-[9px] font-bold tracking-[0.16em] text-orange-200 uppercase">
                  Penawaran Akasha
                </span>
                <strong className="mt-1.5 block truncate text-base leading-tight font-semibold tracking-tight sm:text-lg">
                  {featuredOffer?.name ?? "Perlengkapan pilihan"}
                </strong>
                <span className="mt-1 block truncate text-[10px] font-medium text-white/75">
                  {featuredOffer?.category ?? "Sewa satuan & paket camping"}
                </span>
              </span>

              <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-orange-300 text-slate-950 transition duration-200 group-hover:translate-x-0.5 group-hover:bg-orange-200">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </ScrollReveal>

          {benefits.length > 0 ? (
            <div className="home-promotion-benefits grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 lg:gap-2.5">
              {benefits.map((benefit, index) => {
                const content = (
                  <>
                    <span className="home-promotion-benefit-icon grid size-8 shrink-0 place-items-center rounded-lg">
                      <benefit.icon className="size-4" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-[10px] leading-tight font-semibold tracking-tight sm:text-xs">
                        {benefit.title}
                      </strong>
                      {benefit.meta ? (
                        <span className="mt-1 block text-[9px] leading-tight font-medium text-primary sm:text-[10px]">
                          {benefit.meta}
                        </span>
                      ) : null}
                    </span>
                  </>
                )

                return (
                  <ScrollReveal
                    key={benefit.key}
                    delay={index * 0.045}
                    className={
                      benefits.length === 3 && index === 2
                        ? "col-span-2 sm:col-span-1"
                        : ""
                    }
                  >
                    {benefit.href ? (
                      <a
                        href={benefit.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Tanyakan kebijakan diskon transaksi minimum kepada Tim Akasha"
                        className="home-promotion-benefit group flex h-full min-h-[3.65rem] items-center gap-2 rounded-xl border border-border/70 bg-card px-2.5 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:min-h-[4rem] sm:gap-2.5 sm:px-3"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="home-promotion-benefit flex h-full min-h-[3.65rem] items-center gap-2 rounded-xl border border-border/70 bg-card px-2.5 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:min-h-[4rem] sm:gap-2.5 sm:px-3">
                        {content}
                      </div>
                    )}
                  </ScrollReveal>
                )
              })}
            </div>
          ) : (
            <ScrollReveal>
              <div className="home-promotion-benefit flex min-h-[7.4rem] items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-3 text-xs font-semibold">
                <PackageCheck className="size-4 text-primary" />
                Perlengkapan siap menemani petualangan
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  )
}
