"use client"

import { useState } from "react"
import { ChevronDown, MapPin, MessageCircle, Tent } from "lucide-react"

const BUSINESS_ADDRESS = "QWP7+Q4H, Kota Wetan, Kec. Garut Kota, Kabupaten Garut, Jawa Barat 44111, Indonesia"
const MAP_URL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(BUSINESS_ADDRESS)
const WHATSAPP_URL = "https://wa.me/6287864959365?text=" + encodeURIComponent("Halo Tim Akasha, saya ingin bertanya tentang perlengkapan outdoor.")

export default function AboutUs() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section id="tentang-kami" className="scroll-mt-24 border-y border-border/60 bg-secondary/45 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <span className="section-eyebrow"><Tent className="size-3.5" /> Tentang Akasha</span>
            <h2 className="mt-4 text-3xl leading-[1.1] font-semibold tracking-tight sm:text-4xl">
              Rekan persiapan untuk <span className="font-display font-normal italic text-primary">setiap perjalanan alam.</span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold transition hover:border-primary/35 hover:text-primary">
              <MapPin className="size-3.5" /> Lokasi Akasha
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90">
              Hubungi Tim Akasha <MessageCircle className="size-3.5" />
            </a>
          </div>
        </div>

        <article className="mt-7 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls="about-details-more"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-5"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Tent className="size-4.5" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Kenali Akasha lebih dekat</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">Informasi layanan, cara booking, dan lokasi.</span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-primary">
              {isExpanded ? "Tutup" : "Lihat informasi"}
              <ChevronDown className={"size-4 transition-transform duration-300 " + (isExpanded ? "rotate-180" : "")} />
            </span>
          </button>

          <div id="about-details-more" className="about-details__expandable" data-expanded={isExpanded} aria-hidden={!isExpanded} inert={!isExpanded}>
            <div className="about-details__expandable-inner">
              <div className="grid gap-4 border-t border-border/60 px-4 py-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5 sm:px-5">
                <div>
                  <h3 className="text-xs font-semibold">Pilihan perlengkapan</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Rental perlengkapan camping dan pendakian di Garut, tersedia untuk disewa satuan maupun dalam paket.</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold">Akasha Smart Booking</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Atur barang dan jadwal sewa, kirim pengajuan, lalu pantau booking melalui portal pribadi. Tim Akasha membantu memastikan ketersediaan sebelum booking dikonfirmasi.</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold">Pemeriksaan perlengkapan</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Kondisi barang diperiksa sebelum serah terima. Pengajuan perubahan barang atau jadwal melalui portal berlaku setelah disetujui Tim Akasha.</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold">Lokasi rental</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{BUSINESS_ADDRESS}</p>
                  <a href={MAP_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Buka Google Maps <MapPin className="size-3" /></a>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
