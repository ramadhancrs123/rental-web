import Link from "next/link"
import {
  ArrowUpRight,
  CalendarDays,
  MessageCircle,
  QrCode,
  Send,
  ShoppingBag,
  Sparkles,
} from "lucide-react"
import FaqSection from "@/components/faq-section"
import HomeHero from "@/components/home-hero"
import HomeAdvantagesSection from "@/components/home-advantages-section"
import HomeCatalogEntrySection from "@/components/home-catalog-entry-section"
import HomePromotionSection from "@/components/home-promotion-section"
import BookingLottieIllustration from "@/components/booking/booking-lottie-illustration"
import DestinationsHighlight from "@/components/destinations-highlight"
import ScrollReveal from "@/components/scroll-reveal"
import { fetchPublicTestimonials } from "@/lib/testimonials"
import TestimonialSection from "@/components/testimonial-section"
import AboutUs from "@/components/about-us"
import PwaInstallButton from "@/components/pwa-install-button"
import { WA_NUMBER } from "@/lib/supabase"
import { fetchHomeMarketing } from "@/lib/home-marketing"

const BOOKING_STEPS = [
  { number: "01", icon: ShoppingBag, title: "Pilih perlengkapan" },
  { number: "02", icon: CalendarDays, title: "Tentukan jadwal" },
  { number: "03", icon: Send, title: "Ajukan booking" },
  { number: "04", icon: QrCode, title: "Pantau booking" },
]

export default async function LandingPage() {
  const [testimonialPage, marketing] = await Promise.all([
    fetchPublicTestimonials(0, 3),
    fetchHomeMarketing().catch(() => ({
      toleranceHours: null,
      loyaltyProgramEnabled: false,
      checkoutManualDiscountEnabled: false,
    })),
  ])

  const waLink =
    "https://wa.me/" +
    WA_NUMBER +
    "?text=" +
    encodeURIComponent(
      "Halo Akasha Outdoor, saya ingin bertanya tentang penyewaan perlengkapan outdoor."
    )

  return (
    <div className="homepage-shell overflow-clip bg-background text-foreground">
      <HomeHero />

      <HomeAdvantagesSection toleranceHours={marketing.toleranceHours} />

      <HomeCatalogEntrySection />

      <section
        id="cara-pesan"
        aria-labelledby="home-booking-title"
        className="home-booking-section relative isolate overflow-hidden px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8"
      >
        <span className="home-booking-orb home-booking-orb--one" aria-hidden="true" />
        <span className="home-booking-orb home-booking-orb--two" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 sm:gap-5">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[.16em] text-orange-200 uppercase">
                    <Sparkles className="size-3.5" /> Akasha Smart Booking
                  </span>
                  <h2
                    id="home-booking-title"
                    className="mt-2 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl"
                  >
                    Booking lebih mudah.
                  </h2>
                </div>
                <BookingLottieIllustration />
              </div>
              <Link
                href="/booking/portal"
                className="inline-flex h-9 w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/[.07] px-3.5 text-[11px] font-semibold text-white transition hover:bg-white/[.13] sm:text-xs"
              >
                Cek Booking <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            {BOOKING_STEPS.map((step, index) => (
              <ScrollReveal key={step.number} delay={index * 0.055} className="h-full">
                <article className="home-booking-step flex h-full min-h-[76px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.055] p-3 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/[.09] sm:min-h-[92px] sm:gap-3 sm:rounded-2xl sm:p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-orange-200/20 bg-orange-200/10 text-orange-200 sm:size-9">
                    <step.icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] font-semibold tracking-[.13em] text-orange-200/75">{step.number}</span>
                    <h3 className="mt-0.5 text-[10px] leading-snug font-semibold text-white sm:text-xs">{step.title}</h3>
                  </span>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <HomePromotionSection marketing={marketing} />

      <AboutUs />
      <TestimonialSection items={testimonialPage.items} total={testimonialPage.count} />
      <DestinationsHighlight />

      <section
        id="faq"
        aria-labelledby="home-faq-title"
        className="scroll-mt-24 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="section-eyebrow"><Sparkles className="size-3.5" /> Bantuan</span>
              <h2
                id="home-faq-title"
                className="mt-2 text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-3xl"
              >
                Ada yang ingin diketahui?
              </h2>
            </div>
          </ScrollReveal>
          <div className="mt-6">
            <ScrollReveal><FaqSection /></ScrollReveal>
          </div>
        </div>
      </section>

      <section className="home-final-cta relative isolate overflow-hidden px-4 py-9 text-white sm:px-6 sm:py-11 lg:px-8">
        <span className="home-final-cta-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[9px] font-semibold tracking-[.16em] text-orange-200 uppercase sm:text-[10px]">
              Akasha Outdoor Rent · Garut
            </span>
            <h2 className="mt-3 max-w-2xl text-2xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">
              Siapkan perlengkapanmu.{" "}
              <span className="font-display font-normal text-orange-200 italic">Alam menunggu.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href="/katalog"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-orange-400 px-5 text-xs font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-orange-300 sm:text-sm"
              >
                Mulai Booking <ArrowUpRight className="size-4" />
              </Link>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[.06] px-5 text-xs font-semibold text-white transition hover:bg-white/[.12] sm:text-sm"
              >
                Tanya via WhatsApp <MessageCircle className="size-4" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section
        aria-label="Instal aplikasi Akasha"
        className="px-4 pb-7 pt-4 sm:px-6 sm:pb-9 lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/75 px-4 py-3 sm:flex-row">
          <p className="text-xs font-semibold tracking-tight">Akses Akasha lebih praktis</p>
          <PwaInstallButton className="h-9 px-4" />
        </div>
      </section>
    </div>
  )
}
