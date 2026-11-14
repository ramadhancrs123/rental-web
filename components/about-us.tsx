import {
  MapPin,
  MessageCircle,
  ShieldCheck,
  Tent,
  CalendarDays,
} from "lucide-react"
import ScrollReveal from "@/components/scroll-reveal"

const BUSINESS_ADDRESS =
  "QWP7+Q4H, Kota Wetan, Kec. Garut Kota, Kabupaten Garut, Jawa Barat 44111, Indonesia"
const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(BUSINESS_ADDRESS)
const WHATSAPP_URL =
  "https://wa.me/6287864959365?text=" +
  encodeURIComponent(
    "Halo Tim Akasha, saya ingin bertanya tentang perlengkapan outdoor."
  )

const ABOUT_POINTS = [
  { icon: Tent, title: "Sewa satuan & paket" },
  { icon: CalendarDays, title: "Akasha Smart Booking" },
  { icon: ShieldCheck, title: "Diperiksa sebelum sewa" },
  { icon: MapPin, title: "Garut, Jawa Barat", href: MAP_URL },
]

export default function AboutUs() {
  return (
    <section
      id="tentang-kami"
      className="about-section scroll-mt-24 border-y border-border/60 bg-secondary/45 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="section-eyebrow">
                <Tent className="size-3.5" /> Tentang Akasha
              </span>
              <h2 className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl">
                Persiapan petualangan,{" "}
                <span className="font-display font-normal text-primary italic">
                  lebih praktis.
                </span>
              </h2>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href={MAP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3.5 text-[11px] font-semibold transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:text-primary"
              >
                <MapPin className="size-3.5" /> Lokasi Akasha
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-3.5 text-[11px] font-semibold text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:opacity-90"
              >
                Hubungi Tim Akasha <MessageCircle className="size-3.5" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        <div className="about-points mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ABOUT_POINTS.map((point, index) => {
            const content = (
              <>
                <span className="about-point__icon grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <point.icon className="size-4" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 text-[10px] leading-tight font-semibold sm:text-xs">
                  {point.title}
                </span>
              </>
            )

            return (
              <ScrollReveal key={point.title} delay={index * 0.045}>
                {point.href ? (
                  <a
                    href={point.href}
                    target="_blank"
                    rel="noreferrer"
                    className="about-point group flex min-h-12 items-center gap-2 rounded-xl border border-border/65 bg-card/85 px-2.5 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card sm:px-3"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="about-point flex min-h-12 items-center gap-2 rounded-xl border border-border/65 bg-card/85 px-2.5 py-2 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card sm:px-3">
                    {content}
                  </div>
                )}
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
