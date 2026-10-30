"use client"

import { useState } from "react"
import { ArrowUpRight, ChevronDown, MapPin, MessageCircle, Tent } from "lucide-react"

const BUSINESS_ADDRESS = "Kp. Bentar Girang, Kel. Kota Wetan, Kec. Garut Kota, Kab. Garut, Jawa Barat"
const MAP_URL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(BUSINESS_ADDRESS)
const WHATSAPP_URL = "https://wa.me/6287864959365?text=" + encodeURIComponent("Halo Akasha Outdoor Rent, saya ingin bertanya tentang perlengkapan outdoor.")

export default function AboutUs() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section id="tentang-kami" className="scroll-mt-24 border-y border-border/60 bg-secondary/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-10">
        <div className="lg:pt-2">
          <span className="section-eyebrow"><Tent className="size-3.5" /> Tentang Akasha</span>
          <h2 className="mt-4 text-3xl leading-[1.12] font-semibold tracking-tight sm:text-4xl">Berangkat lebih siap, <span className="font-display font-normal italic text-primary">menikmati lebih banyak.</span></h2>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold transition hover:border-primary/35 hover:text-primary"><MapPin className="size-3.5" /> Lokasi usaha</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90"><MessageCircle className="size-3.5" /> Tanya pengelola <ArrowUpRight className="size-3.5" /></a>
          </div>
        </div>

        <article className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <div className="p-5 sm:p-7">
            <h3 className="text-sm font-semibold">Kenali Akasha lebih dekat</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Cerita singkat, layanan, dan lokasi kami.</p>

            <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Akasha Outdoor Rent membantu menyiapkan perlengkapan untuk rencana camping dan perjalanan alam, dengan informasi yang jelas dan komunikasi langsung bersama pengelola.
              </p>
              <p>
                Akasha berangkat dari gagasan sederhana: persiapan yang baik membuat waktu di alam terasa lebih nyaman. Kami menyediakan layanan penyewaan perlengkapan outdoor untuk pendaki, teman-teman yang ingin camping, keluarga, dan siapa pun yang sedang menyusun perjalanan.
              </p>
            </div>

            <div
              id="about-details-more"
              className="about-details__expandable"
              data-expanded={isExpanded}
              aria-hidden={!isExpanded}
            >
              <div className="about-details__expandable-inner">
                <div className="space-y-4 border-t border-border/60 pt-4 text-sm leading-6 text-muted-foreground">
                  <p>
                    Pilihan perlengkapan serta tarif yang tampil di katalog mengikuti data aktif yang dipublikasikan pengelola. Calon penyewa dapat melihat pilihan yang tersedia dan menyesuaikannya dengan kebutuhan perjalanan, tanpa harus menebak harga dari daftar yang sudah tidak berlaku.
                  </p>
                  <p>
                    Kami mengutamakan komunikasi yang jelas. Sebelum penyewaan disepakati, pengelola membantu memastikan ketersediaan barang, tanggal, tarif, serta aturan pengambilan dan pengembalian.
                  </p>
                  <p>
                    Pemesanan melalui website masih dalam pengembangan, sehingga booking untuk sementara dilakukan melalui kontak pengelola.
                  </p>
                  <p>
                    Akasha Outdoor Rent berlokasi di {BUSINESS_ADDRESS}. Untuk menanyakan pilihan perlengkapan atau merencanakan penyewaan, silakan hubungi kami melalui WhatsApp. Kami akan membantu memberikan informasi yang diperlukan sebelum perjalanan dimulai.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-border/60 pt-4">
              <span
                className={"text-xs font-semibold tracking-[0.3em] text-primary transition-opacity duration-200 " + (isExpanded ? "opacity-0" : "opacity-100")}
                aria-hidden="true"
              >
                . . . . .
              </span>
              <button
                type="button"
                aria-expanded={isExpanded}
                aria-controls="about-details-more"
                onClick={() => setIsExpanded((expanded) => !expanded)}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.06] px-3.5 text-xs font-semibold text-primary transition duration-200 hover:border-primary/45 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
              >
                {isExpanded ? "Tutup detail" : "Lihat detail"}
                <ChevronDown className={"size-3.5 transition-transform duration-300 " + (isExpanded ? "rotate-180" : "")} />
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
