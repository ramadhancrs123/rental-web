import {
  BadgeCheck,
  Clock3,
  Headset,
  ShieldCheck,
} from "lucide-react"
import { NumberTicker } from "@/components/ui/number-ticker"
import HomeInfoDialog from "@/components/home-info-dialog"
import ScrollReveal from "@/components/scroll-reveal"
import { formatToleranceHours } from "@/lib/home-marketing"

type HomeAdvantagesSectionProps = {
  toleranceHours: number | null
}

const ADVANTAGES = [
  {
    icon: BadgeCheck,
    title: "Perlengkapan diperiksa",
    description: "Perlengkapan diperiksa sebelum disewakan agar siap digunakan.",
  },
  {
    icon: ShieldCheck,
    title: "Harga dan pilihan jelas",
    description: "Lihat pilihan, durasi, dan harga sebelum mengajukan booking.",
  },
  {
    icon: Headset,
    title: "Dibantu Tim Akasha",
    description: "Tim Akasha siap membantu pertanyaan seputar penyewaan.",
  },
]

export default function HomeAdvantagesSection({
  toleranceHours,
}: HomeAdvantagesSectionProps) {
  const decimalPlaces =
    toleranceHours !== null && Number.isInteger(toleranceHours) ? 0 : 2

  return (
    <section
      id="keunggulan"
      aria-labelledby="home-advantages-title"
      className="scroll-mt-24 px-4 py-7 sm:px-6 sm:py-9 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <span className="section-eyebrow">Keunggulan Akasha</span>
              <h2
                id="home-advantages-title"
                className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl"
              >
                Lebih siap, lebih tenang.
              </h2>
            </div>
            <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">
              Layanan untuk perjalanan Anda
            </span>
          </div>
        </ScrollReveal>

        <div className="grid gap-3 lg:grid-cols-[minmax(250px,.82fr)_minmax(0,1.6fr)]">
          {toleranceHours !== null ? (
            <ScrollReveal className="h-full">
              <article className="home-tolerance-card group relative isolate flex min-h-[154px] h-full items-center justify-between gap-3 overflow-hidden rounded-[1.45rem] border border-primary/20 p-4 shadow-sm sm:min-h-[170px] sm:p-5">
                <span className="home-tolerance-glow" aria-hidden="true" />
                <span className="home-tolerance-orbit" aria-hidden="true" />
                <div className="relative z-10 min-w-0">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[.14em] text-primary uppercase">
                    <Clock3 className="size-3.5" />
                    Keunggulan utama
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <NumberTicker
                      value={toleranceHours}
                      decimalPlaces={decimalPlaces}
                      className="home-tolerance-number text-[3.25rem] leading-none font-semibold sm:text-6xl"
                    />
                    <span className="text-sm font-bold tracking-[.13em] text-primary uppercase sm:text-base">
                      Jam
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold tracking-tight text-foreground/85">
                    Toleransi pengembalian
                  </p>
                </div>
                <div className="relative z-10 flex h-full flex-col items-end justify-between self-stretch">
                  <HomeInfoDialog
                    title="Toleransi pengembalian"
                    description={
                      "Akasha memberikan toleransi pengembalian " +
                      formatToleranceHours(toleranceHours) +
                      " jam setelah waktu pengembalian yang dijadwalkan. Ketentuan lengkap mengikuti informasi booking Anda."
                    }
                  />
                  <span className="home-tolerance-mark" aria-hidden="true">
                    <Clock3 className="size-8 sm:size-10" strokeWidth={1.25} />
                  </span>
                </div>
              </article>
            </ScrollReveal>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {ADVANTAGES.map((item, index) => (
              <ScrollReveal
                key={item.title}
                delay={index * 0.06}
                className={index === 2 ? "col-span-2 h-full sm:col-span-1" : "h-full"}
              >
                <article className={"home-advantage-tile group flex h-full min-h-[104px] gap-3 rounded-2xl border border-border/70 bg-card p-3 transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:min-h-[154px] sm:flex-col sm:justify-between sm:p-4 " + (index === 2 ? "flex-row items-center justify-between sm:items-start" : "flex-col justify-between")}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="home-advantage-icon grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                      <item.icon className="size-4.5" />
                    </span>
                    <HomeInfoDialog
                      title={item.title}
                      description={item.description}
                    />
                  </div>
                  <h3 className="max-w-[16ch] text-[11px] leading-snug font-semibold tracking-tight sm:text-sm">
                    {item.title}
                  </h3>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
