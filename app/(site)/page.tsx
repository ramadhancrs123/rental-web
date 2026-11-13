import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, MessageCircle,
  PackageCheck, QrCode, Send, ShieldCheck, ShoppingBag, Sparkles, Tent,
} from "lucide-react"
import FaqSection from "@/components/faq-section"
import HomeHero from "@/components/home-hero"
import DestinationsHighlight from "@/components/destinations-highlight"
import ScrollReveal from "@/components/scroll-reveal"
import { fetchPublicTestimonials } from "@/lib/testimonials"
import TestimonialSection from "@/components/testimonial-section"
import AboutUs from "@/components/about-us"
import PwaInstallButton from "@/components/pwa-install-button"
import { WA_NUMBER } from "@/lib/supabase"
import { fetchHomeCatalog, type Catalog } from "@/lib/catalog"

function SectionHeading({ eyebrow, title, italicWord, desc, align = "center" }: {
  eyebrow: string; title: string; italicWord?: string; desc?: string; align?: "center" | "left"
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="section-eyebrow"><Sparkles className="size-3.5" /> {eyebrow}</span>
      <h2 className="mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
        {title} {italicWord && <span className="font-display font-normal text-primary italic">{italicWord}</span>}
      </h2>
      {desc && <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{desc}</p>}
    </div>
  )
}

const EMPTY_CATALOG: Catalog = { usahaNama: null, items: [], packages: [], sales: [] }

const BOOKING_STEPS = [
  { number: "01", icon: ShoppingBag, title: "Pilih perlengkapan", desc: "Temukan perlengkapan satuan atau paket camping sesuai rencana perjalanan." },
  { number: "02", icon: CalendarDays, title: "Atur kebutuhan sewa", desc: "Sesuaikan jumlah barang serta jadwal pengambilan dan pengembalian." },
  { number: "03", icon: Send, title: "Kirim pengajuan", desc: "Tim Akasha membantu memastikan ketersediaan dan detail penyewaan Anda." },
  { number: "04", icon: QrCode, title: "Pantau booking", desc: "Buka portal pribadi melalui tautan, kode akses, atau QR pada bukti booking." },
]

const TRUST_POINTS = [
  { icon: Clock3, title: "Toleransi hingga 10 jam", desc: "Waktu tambahan setelah jadwal pengembalian.", accent: "trust-orange" },
  { icon: Tent, title: "Sewa satuan & paket", desc: "Pilih perlengkapan sesuai kebutuhan perjalanan.", accent: "trust-slate" },
  { icon: ShieldCheck, title: "Diperiksa sebelum serah terima", desc: "Kondisi perlengkapan diperiksa sebelum diserahkan.", accent: "trust-blue" },
  { icon: QrCode, title: "Portal booking pribadi", desc: "Pantau informasi booking melalui akses pribadi.", accent: "trust-cream" },
]

export default async function LandingPage() {
  const [testimonialPage, catalog] = await Promise.all([
    fetchPublicTestimonials(0, 3),
    fetchHomeCatalog().catch(() => EMPTY_CATALOG),
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
        description: item.ringkasan_publik ?? item.deskripsi ?? "Lihat pilihan dan informasi tarif di katalog.",
        imageUrl: item.imageUrl,
        label: item.kategori_nama.trim().toLowerCase() === "tenda & shelter" ? "Perlengkapan utama" : "Perlengkapan sewa",
      })),
    ...catalog.packages.map((item) => ({
      id: item.paket_sewa_id, name: item.nama, category: "Paket camping",
      description: item.deskripsi ?? "Pilihan paket untuk membantu persiapan perjalanan.",
      imageUrl: item.imageUrl, label: "Paket pilihan",
    })),
  ].slice(0, 3)

  const waLink = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(
    "Halo Akasha Outdoor, saya ingin bertanya tentang penyewaan perlengkapan outdoor.",
  )

  return (
    <div className="homepage-shell overflow-clip bg-background text-foreground">
      <HomeHero />

      <section aria-label="Keunggulan Akasha" className="relative z-10 px-4 pb-8 sm:px-6 lg:px-8">
        <div className="home-trust-strip mx-auto -mt-7 grid max-w-7xl grid-cols-2 overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-slate-950/[0.07] sm:-mt-9 lg:grid-cols-4">
          {TRUST_POINTS.map((point, index) => (
            <div key={point.title} className={"home-trust-item flex min-w-0 items-start gap-3 p-4 sm:p-5 " + (index < 2 ? "border-b border-border/60 lg:border-b-0" : "") + (index % 2 === 0 ? " border-r border-border/60" : " lg:border-r") + (index === 3 ? " lg:border-r-0" : "")}>
              <span className={"home-trust-icon " + point.accent}><point.icon className="size-4.5" strokeWidth={1.9} /></span>
              <span className="min-w-0">
                <span className="block text-xs font-bold tracking-tight sm:text-sm">{point.title}</span>
                <span className="mt-1 block text-[10px] leading-[1.45] text-muted-foreground sm:text-xs sm:leading-5">{point.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="katalog-unggulan" className="scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading eyebrow="Jelajahi katalog" title="Perlengkapan tepat," italicWord="perjalanan lebih siap." desc="Jelajahi pilihan perlengkapan satuan, paket camping, dan kebutuhan outdoor untuk perjalanan Anda." align="left" />
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
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-[10px] font-bold tracking-[0.13em] text-primary uppercase">{item.category}</span>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight">{item.name}</h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
                      <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-primary">Lihat di katalog <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border border-dashed border-border bg-card/70 px-6 py-10 text-center">
              <Tent className="mx-auto size-9 text-primary/55" />
              <h3 className="mt-3 text-base font-semibold">Jelajahi pilihan Akasha</h3>
              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">Buka katalog untuk melihat perlengkapan, paket, dan produk yang sedang dipublikasikan.</p>
            </div>
          )}

          <ScrollReveal>
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs leading-5 text-muted-foreground sm:text-sm">Perlengkapan satuan, paket camping, dan produk pilihan untuk menemani rencana perjalanan Anda.</p>
              <Link href="/katalog" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20">Buka Akasha Smart Booking <ArrowUpRight className="size-3.5" /></Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="cara-pesan" className="scroll-mt-24 home-booking-section relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="home-booking-orb home-booking-orb--one" aria-hidden="true" />
        <div className="home-booking-orb home-booking-orb--two" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[10px] font-bold tracking-[0.16em] text-orange-200 uppercase"><Sparkles className="size-3.5" /> Akasha Smart Booking</span>
                <h2 className="mt-5 max-w-xl text-3xl leading-[1.1] font-semibold tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">Sewa perlengkapan, <span className="font-display font-normal italic text-orange-200">lebih terarah.</span></h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Satu alur untuk memilih perlengkapan, mengatur jadwal, mengirim pengajuan, dan memantau booking Anda.</p>
            </div>
          </ScrollReveal>

          <div className="mt-9 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {BOOKING_STEPS.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 0.07}>
                <article className="home-booking-step h-full rounded-2xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09] sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl border border-orange-200/20 bg-orange-200/10 text-orange-200"><step.icon className="size-5" /></span>
                    <span className="font-display text-3xl text-white/25">{step.number}</span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/65 sm:text-sm sm:leading-6">{step.desc}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Semua informasi booking dalam satu portal pribadi.</p>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-white/70 sm:text-sm">Lihat perkembangan penyewaan dan ajukan perubahan barang atau jadwal. Setiap perubahan berlaku setelah disetujui Tim Akasha.</p>
            </div>
            <Link href="/booking/portal" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-4 text-xs font-semibold text-white transition hover:bg-white/[0.14]">Cek booking <ArrowUpRight className="size-3.5" /></Link>
          </div>
        </div>
      </section>

      <section id="keunggulan" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading eyebrow="Mengapa Akasha" title="Lebih siap berangkat," italicWord="lebih tenang." desc="Pilihan perlengkapan, perhatian pada kondisi barang, dan layanan yang membantu perjalanan Anda dipersiapkan dengan lebih baik." align="left" />
              <Link href="/katalog" className="group inline-flex w-fit items-center gap-2 pb-1 text-sm font-semibold text-primary transition hover:gap-3">Jelajahi layanan <ArrowUpRight className="size-4" /></Link>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mt-8">
            <article className="home-tolerance-card relative isolate overflow-hidden rounded-[2rem] border border-primary/20 p-5 sm:p-7 lg:p-9">
              <div className="home-tolerance-glow" aria-hidden="true" />
              <div className="relative grid gap-6 md:grid-cols-[0.7fr_1.3fr] md:items-center md:gap-10">
                <div className="flex items-end gap-3">
                  <span className="text-[6.5rem] leading-[0.76] font-semibold tracking-[-0.09em] text-primary sm:text-[8rem]">10</span>
                  <span className="mb-1 text-lg font-bold tracking-[0.16em] text-primary sm:text-xl">JAM</span>
                </div>
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-primary uppercase"><Clock3 className="size-3.5" /> Keunggulan utama Akasha</span>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">Toleransi pengembalian lebih fleksibel</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Nikmati waktu tambahan hingga 10 jam setelah jadwal pengembalian yang disepakati, sesuai ketentuan sewa Akasha.</p>
                </div>
              </div>
            </article>
          </ScrollReveal>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ScrollReveal><article className="home-benefit-card flex h-full gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:p-5"><span className="home-benefit-icon"><PackageCheck className="size-5" /></span><span><strong className="block text-sm font-semibold">Perlengkapan diperiksa</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Kondisi perlengkapan diperiksa sebelum serah terima agar Anda dapat memulai perjalanan dengan lebih tenang.</span></span></article></ScrollReveal>
            <ScrollReveal delay={0.06}><article className="home-benefit-card flex h-full gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:p-5"><span className="home-benefit-icon"><CheckCircle2 className="size-5" /></span><span><strong className="block text-sm font-semibold">Informasi lebih jelas</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Jelajahi foto, detail perlengkapan, pilihan paket, dan informasi harga dalam katalog.</span></span></article></ScrollReveal>
            <ScrollReveal delay={0.12}><article className="home-benefit-card flex h-full gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:p-5 sm:col-span-2 lg:col-span-1"><span className="home-benefit-icon"><ShieldCheck className="size-5" /></span><span><strong className="block text-sm font-semibold">Didampingi Tim Akasha</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">Tim Akasha membantu memastikan ketersediaan dan detail sewa sebelum booking dikonfirmasi.</span></span></article></ScrollReveal>
          </div>
        </div>
      </section>

      <AboutUs />
      <TestimonialSection items={testimonialPage.items} total={testimonialPage.count} />
      <DestinationsHighlight />

      <section id="faq" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal><SectionHeading eyebrow="Pertanyaan umum" title="Sebelum berangkat," italicWord="pastikan." desc="Temukan jawaban seputar pilihan perlengkapan, proses sewa, dan layanan Akasha." /></ScrollReveal>
          <div className="mt-9"><ScrollReveal><FaqSection /></ScrollReveal></div>
        </div>
      </section>

      <section className="home-final-cta relative isolate overflow-hidden px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="home-final-cta-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[10px] font-semibold tracking-[0.16em] text-orange-200 uppercase"><Tent className="size-3.5" /> Akasha Outdoor Rent · Garut</span>
            <h2 className="mt-5 max-w-3xl text-3xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">Siapkan perlengkapanmu. <span className="font-display font-normal italic text-orange-200">Alam menunggu.</span></h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">Temukan perlengkapan yang sesuai dengan rencana perjalanan dan ajukan penyewaan melalui Akasha Smart Booking.</p>
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/75 px-4 py-4 sm:flex-row sm:px-5">
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold tracking-tight">Akses Akasha lebih praktis</p>
            <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">Pasang Akasha Smart Booking di perangkat Anda untuk membukanya seperti aplikasi.</p>
          </div>
          <PwaInstallButton className="h-9 px-4" />
        </div>
      </section>
    </div>
  )
}
