import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Tent } from "lucide-react"
import { AuroraText } from "@/components/ui/aurora-text"
import HomeHeroParticles from "@/components/home-hero-particles"

export default function HomeHero() {
  return (
    <section
      className="hero-scene relative isolate flex min-h-[min(720px,calc(100svh-5rem))] scroll-mt-20 items-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      <div className="hero-scene__images absolute inset-0 -z-20" aria-hidden="true">
        <div className="hero-scene__image hero-scene__image--day">
          <Image
            src="/bg_light.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={75}
            className="object-cover object-[66%_center] sm:object-center"
          />
        </div>
        <div className="hero-scene__image hero-scene__image--night">
          <Image
            src="/bg_dark.webp"
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            quality={75}
            className="object-cover object-[66%_center] sm:object-center"
          />
        </div>
      </div>

      <div className="hero-scene__scrim absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-atmosphere absolute inset-0 -z-[5] overflow-hidden" aria-hidden="true">
        <span className="hero-atmosphere__halo hero-atmosphere__halo--one" />
        <span className="hero-atmosphere__ribbon hero-atmosphere__ribbon--one" />
        <span className="hero-atmosphere__sunbeam" />
        <HomeHeroParticles />
      </div>
      <div className="hero-scene__stars absolute inset-0 -z-10" aria-hidden="true" />
      <div className="hero-celestial hero-celestial--sun" aria-hidden="true"><span /></div>
      <div className="hero-celestial hero-celestial--moon" aria-hidden="true"><span /></div>
      <div className="hero-scene__grain absolute inset-0 -z-10" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="hero-copy max-w-[900px] text-white">
          <div className="hero-enter hero-enter--1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/30 px-3.5 py-2 text-[10px] font-semibold tracking-[0.18em] text-white/95 uppercase shadow-sm backdrop-blur-md sm:text-[11px]">
            <Tent className="size-4 text-orange-300" />
            Akasha Outdoor Rent · Garut
          </div>

          <h1
            id="hero-title"
            className="hero-enter hero-enter--2 mt-5 max-w-[13ch] text-[clamp(2.6rem,5.2vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.055em] text-balance [text-shadow:0_3px_34px_rgba(0,0,0,0.34)] sm:mt-6 sm:max-w-[18ch] lg:max-w-[24ch]"
          >
            Sewa perlengkapan outdoor.
            <br className="hidden lg:block" />{" "}
            <AuroraText
              colors={["#FFE4BE", "#FFB56B", "#F38A48", "#F5C98D"]}
              speed={0.45}
              className="hero-aurora-heading font-display font-normal italic"
            >
              Berangkat lebih siap.
            </AuroraText>
          </h1>

          <p className="hero-enter hero-enter--3 mt-5 hidden max-w-md text-sm leading-6 text-white/82 sm:block lg:text-base">
            Sewa satuan maupun paket camping melalui Akasha Smart Booking.
          </p>

          <div className="hero-enter hero-enter--4 mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/katalog"
              aria-label="Mulai booking melalui Akasha Smart Booking"
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-orange-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-950/30 transition duration-300 hover:-translate-y-0.5 hover:bg-orange-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-slate-900 sm:min-h-13 sm:px-7 sm:text-base"
            >
              Mulai Booking <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/booking/portal"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.15] sm:text-sm"
            >
              Cek Booking <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="hero-enter hero-enter--5 mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium tracking-wide text-white/75 sm:mt-10 sm:text-xs">
            <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-orange-300 shadow-[0_0_10px_rgba(255,174,97,.8)]" /> Sewa satuan & paket</span>
            <span className="inline-flex items-center gap-2"><span className="size-1.5 rounded-full bg-orange-300 shadow-[0_0_10px_rgba(255,174,97,.8)]" /> Toleransi pengembalian</span>
            <span className="hidden items-center gap-2 sm:inline-flex"><span className="size-1.5 rounded-full bg-orange-300 shadow-[0_0_10px_rgba(255,174,97,.8)]" /> Booking online</span>
          </div>
        </div>
      </div>

      <div className="hero-scroll-cue pointer-events-none absolute right-5 bottom-6 hidden items-center gap-2 text-[9px] font-semibold tracking-[.2em] text-white/55 uppercase sm:flex">
        Jelajahi Akasha <span className="grid size-7 place-items-center rounded-full border border-white/20"><ArrowRight className="size-3 rotate-90" /></span>
      </div>
    </section>
  )
}
