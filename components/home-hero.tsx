"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Tent } from "lucide-react"

export default function HomeHero() {
  return (
    <section className="hero-scene relative isolate flex min-h-[min(740px,calc(100svh-5rem))] scroll-mt-20 items-center overflow-hidden" aria-labelledby="hero-title">
      <div className="hero-scene__images absolute inset-0 -z-20" aria-hidden="true">
        <div className="hero-scene__image hero-scene__image--day">
          <Image src="/bg_light.webp" alt="" fill priority sizes="100vw" quality={78} className="object-cover object-[64%_center] sm:object-center" />
        </div>
        <div className="hero-scene__image hero-scene__image--night">
          <Image src="/bg_dark.webp" alt="" fill loading="lazy" sizes="100vw" quality={75} className="object-cover object-[64%_center] sm:object-center" />
        </div>
      </div>

      <div className="hero-scene__scrim absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-scene__stars absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-celestial hero-celestial--sun" aria-hidden="true"><span /></div>
      <div className="hero-celestial hero-celestial--moon" aria-hidden="true"><span /></div>
      <div className="hero-scene__grain absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="hero-copy max-w-[700px] text-white">
          <div className="hero-enter hero-enter--1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/25 px-3.5 py-2 text-[10px] font-semibold tracking-[0.18em] text-white/95 uppercase shadow-sm backdrop-blur-md sm:text-[11px]">
            <Tent className="size-4 text-orange-300" />
            Akasha Outdoor Rent · Garut
          </div>

          <h1 id="hero-title" className="hero-enter hero-enter--2 mt-5 max-w-[13ch] text-[clamp(2.55rem,6.1vw,5.25rem)] leading-[0.99] font-semibold tracking-[-0.055em] text-balance [text-shadow:0_3px_30px_rgba(0,0,0,0.28)] sm:mt-6">
            Persiapkan petualanganmu <span className="font-display font-normal text-orange-200 italic">dengan lebih mudah.</span>
          </h1>

          <div className="hero-enter hero-enter--3 mt-7">
            <Link
              href="/katalog"
              aria-label="Buka Akasha Smart Booking dan jelajahi katalog"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-orange-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-950/25 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 sm:min-h-13 sm:px-7 sm:text-base"
            >
              Akasha Smart Booking <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
