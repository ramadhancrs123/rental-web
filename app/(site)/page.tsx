import Link from "next/link"
import {
  ArrowUpRight, CalendarCheck, Clock3, Compass,
  MessageCircle, PackageCheck, QrCode, Sparkles, Tent,
} from "lucide-react"
import FaqSection from "@/components/faq-section"
import HomeHero from "@/components/home-hero"
import DestinationsHighlight from "@/components/destinations-highlight"
import ScrollReveal from "@/components/scroll-reveal"
import { fetchPublicTestimonials } from "@/lib/testimonials"
import TestimonialSection from "@/components/testimonial-section"
import AboutUs from "@/components/about-us"
import BookingNoticeDialog from "@/components/booking-notice-dialog"
import { WA_NUMBER } from "@/lib/supabase"

function SectionHeading({ eyebrow, title, italicWord, desc, align = "center" }: {
  eyebrow: string; title: string; italicWord?: string; desc?: string; align?: "center" | "left"
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="section-eyebrow"><Sparkles className="size-3.5" /> {eyebrow}</span>
      <h2 className="mt-4 text-3xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {title} {italicWord && <span className="font-display font-normal text-primary italic">{italicWord}</span>}
      </h2>
      {desc && <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{desc}</p>}
    </div>
  )
}

const FEATURES = [
  { icon: CalendarCheck, number: "01", title: "Booking online", desc: "Ajukan permintaan sewa dan lanjutkan konfirmasi bersama pengelola." },
  { icon: PackageCheck, number: "02", title: "Perlengkapan diperiksa", desc: "Kondisi barang diperiksa sebelum diserahterimakan." },
  { icon: QrCode, number: "03", title: "Serah terima praktis", desc: "QR reservasi membantu identifikasi saat pengambilan barang." },
]

const STEPS = [
  { number: "01", icon: Compass, title: "Pilih perlengkapan", desc: "Jelajahi katalog, periksa tarif yang tersedia, lalu tentukan kebutuhan dan tanggal sewa." },
  { number: "02", icon: CalendarCheck, title: "Ajukan booking", desc: "Lengkapi informasi yang diminta dan kirim permintaan agar admin dapat memeriksa ketersediaan." },
  { number: "03", icon: MessageCircle, title: "Konfirmasi & ambil", desc: "Ikuti konfirmasi admin melalui WhatsApp, lalu lakukan serah terima sesuai prosedur." },
]

export default async function LandingPage() {
  const testimonialPage = await fetchPublicTestimonials(0, 3)
  const waLink = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent("Halo Akasha Outdoor Rent, saya ingin bertanya tentang penyewaan perlengkapan outdoor.")

  return (
    <div className="overflow-clip bg-background text-foreground">
      <HomeHero />

      <section id="keunggulan" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading eyebrow="Mengapa Akasha" title="Lebih siap berangkat," italicWord="lebih tenang." desc="Hal penting untuk menyewa perlengkapan outdoor—disajikan jelas dari awal sampai serah terima." align="left" />
              <BookingNoticeDialog label="Mulai booking" className="group inline-flex w-fit items-center gap-2 pb-1 text-sm font-semibold text-primary transition hover:gap-3" />
            </div>
          </ScrollReveal>

          <ScrollReveal className="mt-8">
            <article className="feature-highlight relative overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/[0.13] via-card to-secondary/55 p-5 sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-primary/[0.09] blur-3xl" />
              <div className="relative grid gap-5 md:grid-cols-[0.72fr_1.28fr] md:items-center md:gap-8">
                <div className="flex items-end gap-3">
                  <span className="feature-stat-number text-[6.5rem] leading-[0.78] font-semibold tracking-[-0.09em] text-primary sm:text-[8rem]">10</span>
                  <span className="mb-1 text-lg font-bold tracking-[0.16em] text-primary sm:text-xl">JAM</span>
                </div>
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-primary uppercase">
                    <Clock3 className="size-3.5" /> Keunggulan utama Akasha
                  </span>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Toleransi pengembalian lebih fleksibel</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Ada toleransi pengembalian hingga 10 jam setelah jadwal pengembalian, sesuai ketentuan rental.
                  </p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <ScrollReveal key={feature.title} delay={index * 0.07}>
                <article className="group flex h-full items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    <feature.icon className="size-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="text-[10px] font-bold tracking-[0.14em] text-primary/80">{feature.number}</span>
                    <span className="mt-0.5 block text-sm font-semibold tracking-tight">{feature.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{feature.desc}</span>
                  </span>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <AboutUs />



      <section id="katalog-unggulan" className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <Link
              href="/katalog"
              aria-label="Jelajahi katalog perlengkapan dan paket camping Akasha"
              className="catalog-entry group relative isolate block overflow-hidden rounded-[2rem] border border-primary/25 bg-gradient-to-br from-card via-card to-primary/[0.09] p-5 shadow-lg shadow-primary/[0.04] transition duration-500 hover:-translate-y-1 hover:border-primary/45 hover:shadow-xl hover:shadow-primary/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-4 sm:p-7 lg:p-8"
            >
              <div className="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full bg-primary/[0.14] blur-3xl transition duration-700 group-hover:scale-125" aria-hidden="true" />
              <Tent className="pointer-events-none absolute -right-5 -bottom-10 hidden size-56 rotate-[-14deg] text-primary/[0.08] transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-105 sm:block" strokeWidth={0.8} aria-hidden="true" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-primary uppercase">
                    <Sparkles className="size-3.5" /> Katalog Akasha
                  </span>
                  <h2 className="mt-4 max-w-xl text-[1.65rem] leading-[1.13] font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
                    Perlengkapan & paket camping <span className="font-display font-normal italic text-primary">untuk perjalananmu.</span>
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Temukan perlengkapan satuan atau pilihan paket camping. Lihat foto, detail, dan tarifnya langsung di halaman katalog.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                      <Tent className="size-3.5 text-primary" /> Sewa perlengkapan
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                      <PackageCheck className="size-3.5 text-primary" /> Paket camping
                    </span>
                  </div>
                </div>

                <span className="catalog-entry__action inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition duration-300 group-hover:gap-3 group-hover:shadow-lg sm:w-auto">
                  Jelajahi katalog <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <DestinationsHighlight />

      <section id="cara-pesan" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal><SectionHeading eyebrow="Cara menyewa" title="Tiga langkah menuju" italicWord="petualangan." desc="Alur yang sederhana, dengan informasi dan konfirmasi yang jelas." /></ScrollReveal>
          <div className="relative mt-12 grid gap-7 md:grid-cols-3 md:gap-5 lg:mt-16">
            <div className="absolute top-8 right-[17%] left-[17%] hidden border-t border-dashed border-primary/25 md:block" aria-hidden="true" />
            {STEPS.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 0.1}>
                <article className="relative h-full rounded-3xl border border-border/60 bg-card p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                  <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-background text-primary shadow-sm"><step.icon className="size-6" /><span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{step.number}</span></div>
                  <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{step.desc}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal>
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl bg-secondary/65 p-5 sm:flex-row sm:px-7">
              <p className="text-center text-sm text-muted-foreground sm:text-left">Sudah tahu perlengkapan yang dibutuhkan?</p>
              <BookingNoticeDialog label="Mulai booking" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <TestimonialSection items={testimonialPage.items} total={testimonialPage.count} />

      <section id="faq" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal><SectionHeading eyebrow="Pertanyaan umum" title="Sebelum berangkat," italicWord="pastikan." desc="Jawaban ringkas untuk membantu kamu memahami proses dan ketentuan rental." /></ScrollReveal>
          <div className="mt-10"><ScrollReveal><FaqSection /></ScrollReveal></div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-slate-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="cta-glow pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[11px] font-semibold tracking-[0.16em] text-orange-200 uppercase"><MessageCircle className="size-3.5" /> Teman merencanakan perjalanan</span>
            <h2 className="mt-5 max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">Siapkan perlengkapanmu. <span className="font-display font-normal text-orange-300 italic">Alam menunggu.</span></h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Masih bingung memilih perlengkapan? Hubungi Akasha untuk bertanya tentang pilihan yang tersedia dan proses booking.</p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <BookingNoticeDialog label="Pesan Sekarang" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-400" />
              <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10">Tanya via WhatsApp <ArrowUpRight className="size-4" /></a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
