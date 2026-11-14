import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, MessageCircle,
  PackageCheck, QrCode, Send, ShieldCheck, ShoppingBag, Sparkles, Tent,
} from "lucide-react"
import FaqSection from "@/components/faq-section"
import HomeHero from "@/components/home-hero"
import DestinationsHighlight from "@/components/destinations-highlight"
import ScrollReveal from "@/components/scroll-reveal"
import HomePromotionSection from "@/components/home-promotion-section"
import { fetchPublicTestimonials } from "@/lib/testimonials"
import TestimonialSection from "@/components/testimonial-section"
import AboutUs from "@/components/about-us"
import PwaInstallButton from "@/components/pwa-install-button"
import { WA_NUMBER } from "@/lib/supabase"
import { fetchHomeCatalog, type Catalog } from "@/lib/catalog"
import { fetchHomeMarketing, findFeaturedOffer } from "@/lib/home-marketing"

function SectionHeading({ eyebrow, title, italicWord, align = "center" }: {
  eyebrow: string; title: string; italicWord?: string; align?: "center" | "left"
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="section-eyebrow"><Sparkles className="size-3.5" /> {eyebrow}</span>
      <h2 className="mt-2 text-2xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
        {title} {italicWord && <span className="font-display font-normal text-primary italic">{italicWord}</span>}
      </h2>
    </div>
  )
}

const EMPTY_CATALOG: Catalog = { usahaNama: null, items: [], packages: [], sales: [] }

const BOOKING_STEPS = [
  { number: "01", icon: ShoppingBag, title: "Pilih perlengkapan" },
  { number: "02", icon: CalendarDays, title: "Atur jadwal sewa" },
  { number: "03", icon: Send, title: "Kirim pengajuan" },
  { number: "04", icon: QrCode, title: "Pantau booking" },
]

const TRUST_POINTS = [
  { icon: Tent, title: "Sewa satuan & paket", accent: "trust-slate" },
  { icon: ShieldCheck, title: "Diperiksa sebelum sewa", accent: "trust-blue" },
  { icon: QrCode, title: "Portal booking pribadi", accent: "trust-cream" },
]

export default async function LandingPage() {
  const [testimonialPage, catalog, marketing] = await Promise.all([
    fetchPublicTestimonials(0, 3),
    fetchHomeCatalog().catch(() => EMPTY_CATALOG),
    fetchHomeMarketing().catch(() => ({
      toleranceHours: null,
      loyaltyProgramEnabled: false,
      checkoutManualDiscountEnabled: false,
    })),
  ])

  const featuredItems = [
    ...catalog.items
      .slice()
      .sort((left, right) => {
        const leftPriority = left.kategori_nama.trim().toLowerCase() === "tenda & shelter" ? 0 : 1
        const rightPriority = right.kategori_nama.trim().toLowerCase() === "tenda & shelter" ? 0 : 1
        return leftPriority - rightPriority
      })
      .map((item) => ({
        id: item.barang_id, name: item.nama, category: item.kategori_nama,
        imageUrl: item.imageUrl,
        label: item.kategori_nama.trim().toLowerCase() === "tenda & shelter" ? "Perlengkapan utama" : "Perlengkapan sewa",
      })),
    ...catalog.packages.map((item) => ({
      id: item.paket_sewa_id, name: item.nama, category: "Paket camping",
      imageUrl: item.imageUrl, label: "Paket pilihan",
    })),
  ].slice(0, 3)
  const featuredOffer = findFeaturedOffer(catalog)

  const waLink = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(
    "Halo Akasha Outdoor, saya ingin bertanya tentang penyewaan perlengkapan outdoor.",
  )
  const checkoutDiscountLink = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(
    "Halo Tim Akasha, saya ingin bertanya mengenai penawaran diskon untuk transaksi dengan nilai minimum.",
  )

  return (
    <div className="homepage-shell overflow-clip bg-background text-foreground">
      <HomeHero />

      <section aria-label="Keunggulan Akasha" className="relative z-10 px-4 pb-5 sm:px-6 lg:px-8">
        <div className="home-trust-strip mx-auto -mt-7 grid max-w-7xl grid-cols-3 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-slate-950/[0.07] sm:-mt-9">
          {TRUST_POINTS.map((point, index) => (
            <div key={point.title} className={"home-trust-item flex min-w-0 flex-col items-center justify-center gap-1.5 p-2.5 text-center sm:flex-row sm:items-start sm:justify-start sm:gap-3 sm:p-4 sm:text-left " + (index < TRUST_POINTS.length - 1 ? "border-r border-border/60" : "")}>
              <span className={"home-trust-icon " + point.accent}><point.icon className="size-4.5" strokeWidth={1.9} /></span>
              <span className="min-w-0">
                <span className="block text-[9px] leading-tight font-bold tracking-tight sm:text-sm">{point.title}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <HomePromotionSection featuredOffer={featuredOffer} marketing={marketing} checkoutDiscountHref={checkoutDiscountLink} />

      <section id="katalog-unggulan" className="scroll-mt-24 px-4 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading eyebrow="Jelajahi katalog" title="Perlengkapan tepat," italicWord="perjalanan lebih siap." align="left" />
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <span className="home-category-chip"><Tent className="size-3.5" /> {catalog.items.length} perlengkapan</span>
                <span className="home-category-chip"><PackageCheck className="size-3.5" /> {catalog.packages.length} paket</span>
                <span className="home-category-chip"><ShoppingBag className="size-3.5" /> {catalog.sales.length} produk beli</span>
              </div>
            </div>
          </ScrollReveal>

          {featuredItems.length > 0 ? (
            <div className="home-featured-grid mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredItems.map((item, index) => (
                <ScrollReveal key={item.id} delay={index * 0.06}>
                  <Link href="/katalog" aria-label={"Lihat " + item.name + " di Akasha Smart Booking"} className="home-featured-card group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-slate-950/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4">
                    <div className="home-featured-image relative aspect-[16/10] overflow-hidden">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill unoptimized sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw" className="object-cover transition duration-700 group-hover:scale-[1.04]" />
                      ) : (
                        <div className="home-product-placeholder absolute inset-0 grid place-items-center"><Tent className="size-12 text-primary/45" strokeWidth={1.1} /></div>
                      )}
                      <span className="absolute top-3 left-3 rounded-full border border-white/25 bg-slate-950/65 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md">{item.label}</span>
                      <span className="absolute right-3 bottom-3 grid size-9 place-items-center rounded-full bg-white/95 text-slate-900 shadow-md transition group-hover:rotate-45"><ArrowUpRight className="size-4" /></span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <span className="text-[10px] font-bold tracking-[0.13em] text-primary uppercase">{item.category}</span>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight">{item.name}</h3>
                      <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary">Lihat di katalog <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/70 px-5 py-7 text-center">
              <Tent className="mx-auto size-9 text-primary/55" />
              <h3 className="mt-3 text-base font-semibold">Jelajahi pilihan Akasha</h3>
            </div>
          )}

          <ScrollReveal>
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-primary/15 bg-primary/[0.055] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <span className="text-[10px] font-semibold text-muted-foreground">Sewa satuan · Paket camping · Produk pilihan</span>
              <Link href="/katalog" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20">Buka Akasha Smart Booking <ArrowUpRight className="size-3.5" /></Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="cara-pesan" className="scroll-mt-24 home-booking-section relative isolate overflow-hidden px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="home-booking-orb home-booking-orb--one" aria-hidden="true" />
        <div className="home-booking-orb home-booking-orb--two" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[10px] font-bold tracking-[0.16em] text-orange-200 uppercase"><Sparkles className="size-3.5" /> Akasha Smart Booking</span>
                <h2 className="mt-5 max-w-xl text-3xl leading-[1.1] font-semibold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">Sewa perlengkapan, <span className="font-display font-normal italic text-orange-200">lebih terarah.</span></h2>
              </div>
            </div>
          </ScrollReveal>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {BOOKING_STEPS.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 0.07}>
                <article className="home-booking-step flex min-h-[5.6rem] h-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-3.5 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.09] sm:p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-orange-200/20 bg-orange-200/10 text-orange-200"><step.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[9px] font-semibold tracking-[0.12em] text-orange-200/75">{step.number}</span>
                    <h3 className="mt-0.5 text-xs font-semibold text-white sm:text-sm">{step.title}</h3>
                  </span>
                </article>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p className="text-xs font-semibold text-white sm:text-sm">Portal pribadi · Pantau booking Anda</p>
            <Link href="/booking/portal" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 text-xs font-semibold text-white transition hover:bg-white/[0.14]">Cek booking <ArrowUpRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      <section id="keunggulan" className="scroll-mt-24 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading eyebrow="Mengapa Akasha" title="Lebih siap berangkat," italicWord="lebih tenang." align="left" />
              <Link href="/katalog" className="group inline-flex w-fit items-center gap-2 pb-1 text-sm font-semibold text-primary transition hover:gap-3">Jelajahi layanan <ArrowUpRight className="size-4" /></Link>
            </div>
          </ScrollReveal>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">

            <ScrollReveal><article className="home-benefit-card flex min-h-14 h-full items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5"><span className="home-benefit-icon size-8 rounded-lg"><PackageCheck className="size-4" /></span><strong className="text-[11px] font-semibold sm:text-xs">Perlengkapan diperiksa</strong></article></ScrollReveal>
            <ScrollReveal delay={0.06}><article className="home-benefit-card flex min-h-14 h-full items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5"><span className="home-benefit-icon size-8 rounded-lg"><CheckCircle2 className="size-4" /></span><strong className="text-[11px] font-semibold sm:text-xs">Informasi katalog jelas</strong></article></ScrollReveal>
            <ScrollReveal delay={0.12}><article className="home-benefit-card flex min-h-14 h-full items-center gap-2.5 rounded-xl border border-border/70 bg-card px-3 py-2.5"><span className="home-benefit-icon size-8 rounded-lg"><ShieldCheck className="size-4" /></span><strong className="text-[11px] font-semibold sm:text-xs">Didampingi Tim Akasha</strong></article></ScrollReveal>
          </div>
        </div>
      </section>

      <AboutUs />
      <TestimonialSection items={testimonialPage.items} total={testimonialPage.count} />
      <DestinationsHighlight />

      <section id="faq" className="scroll-mt-24 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal><SectionHeading eyebrow="Pertanyaan umum" title="Sebelum berangkat," italicWord="pastikan." /></ScrollReveal>
          <div className="mt-9"><ScrollReveal><FaqSection /></ScrollReveal></div>
        </div>
      </section>

      <section className="home-final-cta relative isolate overflow-hidden px-4 py-10 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="home-final-cta-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[10px] font-semibold tracking-[0.16em] text-orange-200 uppercase"><Tent className="size-3.5" /> Akasha Outdoor Rent · Garut</span>
            <h2 className="mt-4 max-w-3xl text-2xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">Siapkan perlengkapanmu. <span className="font-display font-normal italic text-orange-200">Alam menunggu.</span></h2>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/katalog" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange-400 px-6 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-orange-300">Akasha Smart Booking <ArrowUpRight className="size-4" /></Link>
              <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.12]">Tanya via WhatsApp <MessageCircle className="size-4" /></a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section aria-label="Instal aplikasi Akasha" className="px-4 pb-8 pt-5 sm:px-6 sm:pb-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/75 px-4 py-3 sm:flex-row sm:px-4">
          <p className="text-xs font-semibold tracking-tight">Akses Akasha lebih praktis</p>
          <PwaInstallButton className="h-9 px-4" />
        </div>
      </section>
    </div>
  )
}
