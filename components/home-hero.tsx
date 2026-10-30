"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowDown, MoonStar, Sparkles, Sun, Tent } from "lucide-react"
import { useTheme } from "next-themes"
import BookingNoticeDialog from "@/components/booking-notice-dialog"

export default function HomeHero() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <section className="hero-scene relative isolate flex min-h-[min(780px,calc(100svh-5rem))] scroll-mt-20 items-center overflow-hidden" aria-labelledby="hero-title">
      <div className="hero-scene__images absolute inset-0 -z-20" aria-hidden="true">
        <div className="hero-scene__image hero-scene__image--day">
          <Image src="/bg_light.webp" alt="" fill priority sizes="100vw" quality={75} className="object-cover object-[62%_center] sm:object-center" />
        </div>
        <div className="hero-scene__image hero-scene__image--night">
          <Image src="/bg_dark.webp" alt="" fill loading="lazy" sizes="100vw" quality={75} className="object-cover object-[62%_center] sm:object-center" />
        </div>
      </div>

      <div className="hero-scene__scrim absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-scene__stars absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-celestial hero-celestial--sun" aria-hidden="true"><span /></div>
      <div className="hero-celestial hero-celestial--moon" aria-hidden="true"><span /></div>
      <div className="hero-scene__grain absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-9 sm:px-6 sm:pb-10 lg:px-8 lg:pb-10 lg:pt-10">
        <div className="hero-copy max-w-[680px] text-white">
          <div className="hero-enter hero-enter--1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/20 px-3.5 py-2 text-[11px] font-semibold tracking-[0.18em] text-white/95 uppercase shadow-sm backdrop-blur-md">
            <Tent className="size-4 text-orange-300" />
            Akasha Outdoor Rent
          </div>

          <h1 id="hero-title" className="hero-enter hero-enter--2 mt-6 max-w-[12ch] text-[clamp(2.7rem,5.5vw,5rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance [text-shadow:0_3px_30px_rgba(0,0,0,0.24)]">
            Petualanganmu dimulai <span className="font-display font-normal text-orange-300 italic">dari sini.</span>
          </h1>

          <p className="hero-enter hero-enter--3 mt-5 hidden max-w-[620px] text-base leading-7 text-white/90 sm:block sm:text-lg sm:leading-8">
            Sewa tenda dan perlengkapan untuk camping serta perjalanan alam. Pilih kebutuhan, tentukan tanggal, lalu ajukan booking.
          </p>

          <div className="hero-enter hero-enter--4 mt-6 flex flex-wrap items-center gap-3">
            <BookingNoticeDialog label="Pesan Sekarang" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-400 sm:h-13 sm:px-7" />
            <Link href="/katalog" className="inline-flex h-12 items-center justify-center rounded-full border border-white/45 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/20 sm:h-13 sm:px-7">Jelajahi Katalog</Link>
          </div>


        </div>


      </div>

      <a href="#katalog-unggulan" className="hero-scroll-cue absolute right-5 bottom-5 hidden items-center gap-2 text-[10px] font-semibold tracking-[0.2em] text-white/75 uppercase transition hover:text-white lg:flex">
        Jelajahi Akasha <ArrowDown className="size-3.5" />
      </a>

      <button type="button" className="hero-theme-hint absolute top-5 right-5 hidden items-center gap-2 rounded-full border border-white/20 bg-slate-950/20 px-3 py-2 text-xs text-white/90 backdrop-blur-md md:flex" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={isDark ? "Beralih ke suasana siang" : "Beralih ke suasana malam"} title={isDark ? "Beralih ke suasana siang" : "Beralih ke suasana malam"}>
        {isDark ? <Sun className="size-4 text-amber-200" /> : <MoonStar className="size-4 text-sky-100" />}
        <span>{isDark ? "Rasakan suasana siang" : "Rasakan suasana malam"}</span>
        <Sparkles className="size-3 text-orange-200" />
      </button>
    </section>
  )
}
