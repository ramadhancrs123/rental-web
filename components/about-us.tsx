import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Compass,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Tent,
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

const BRAND_PILLARS = [
  {
    icon: Tent,
    title: "Pilihan fleksibel",
    description: "Sewa satuan, paket camping, atau produk outdoor.",
  },
  {
    icon: CalendarDays,
    title: "Persiapan lebih praktis",
    description: "Pilih perlengkapan dan atur jadwal melalui Smart Booking.",
  },
  {
    icon: ShieldCheck,
    title: "Perlengkapan diperiksa",
    description: "Kondisi barang diperiksa sebelum disewakan.",
  },
]

export default function AboutUs() {
  return (
    <section
      id="tentang-kami"
      aria-labelledby="about-akasha-title"
      className="about-section scroll-mt-24 border-y border-border/60 bg-secondary/45 px-4 py-9 sm:px-6 sm:py-11 lg:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)] lg:items-start lg:gap-8">
          <ScrollReveal>
            <div className="min-w-0">
              <span className="section-eyebrow">
                <Compass className="size-3.5" /> Mengenal Akasha
              </span>
              <h2
                id="about-akasha-title"
                className="mt-2 max-w-2xl text-2xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl"
              >
                Persiapan lebih mudah,{" "}
                <span className="font-display font-normal text-primary italic">
                  petualangan lebih dekat.
                </span>
              </h2>

              <p className="about-story-preview mt-3 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                Akasha Outdoor Rent berbasis di Garut, Jawa Barat. Kami membantu
                Anda menyiapkan perjalanan melalui pilihan sewa perlengkapan
                satuan, paket camping, dan produk outdoor. Semua dapat dijelajahi
                melalui Akasha Smart Booking—lebih praktis sejak memilih hingga
                mengajukan booking.
              </p>

              <details className="about-story-details mt-3 max-w-2xl">
                <summary className="about-story-trigger flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full text-xs font-semibold text-primary transition hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                  <span className="about-story-closed-label">Kenali Akasha lebih dekat</span>
                  <span className="about-story-open-label">Tutup informasi</span>
                  <ChevronDown
                    className="about-story-chevron size-4 transition-transform duration-300"
                    aria-hidden="true"
                  />
                </summary>

                <div className="about-story-expanded mt-4 space-y-4 border-t border-border/60 pt-4">
                  <div className="space-y-3 text-xs leading-6 text-muted-foreground sm:text-sm">
                    <p>
                      Setiap perjalanan memiliki kebutuhan yang berbeda. Karena
                      itu, Akasha menyediakan pilihan perlengkapan untuk disewa
                      satuan, paket camping untuk persiapan yang lebih ringkas,
                      serta produk outdoor yang dapat dibeli. Anda dapat melihat
                      pilihan dan informasi harga di katalog sebelum mengajukan
                      booking.
                    </p>
                    <p>
                      Melalui Akasha Smart Booking, Anda dapat memilih barang,
                      mengatur jumlah, menentukan jadwal pengambilan dan
                      pengembalian, lalu mengirim pengajuan. Setelah itu,
                      perkembangan booking dapat dipantau melalui portal
                      pelanggan.
                    </p>
                    <p>
                      Kami memeriksa kondisi perlengkapan sebelum disewakan.
                      Apabila Anda membutuhkan informasi tentang pilihan barang
                      atau proses penyewaan, Tim Akasha dapat dihubungi secara
                      langsung.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {BRAND_PILLARS.map((pillar) => (
                      <article
                        key={pillar.title}
                        className="about-story-pillar rounded-xl border border-border/65 bg-card/80 p-3"
                      >
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <pillar.icon className="size-4" strokeWidth={1.8} />
                        </span>
                        <h3 className="mt-2 text-[11px] font-semibold tracking-tight text-foreground sm:text-xs">
                          {pillar.title}
                        </h3>
                        <p className="mt-1 text-[10px] leading-4 text-muted-foreground sm:text-[11px]">
                          {pillar.description}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </details>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <aside className="about-brand-card relative isolate overflow-hidden rounded-[1.4rem] border border-primary/15 bg-card p-4 shadow-sm sm:p-5">
              <span className="about-brand-glow" aria-hidden="true" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-[9px] font-bold tracking-[.14em] text-primary uppercase">
                  <Tent className="size-3.5" /> Akasha Outdoor Rent
                </span>
                <p className="mt-3 text-lg leading-tight font-semibold tracking-tight sm:text-xl">
                  Teman persiapan{" "}
                  <span className="font-display font-normal text-primary italic">
                    perjalanan Anda.
                  </span>
                </p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2.5 rounded-xl border border-border/65 bg-background/65 px-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9px] font-medium text-muted-foreground">
                        Berbasis di
                      </span>
                      <strong className="block text-xs">Garut, Jawa Barat</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-border/65 bg-background/65 px-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <ShoppingBag className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9px] font-medium text-muted-foreground">
                        Pilihan kebutuhan
                      </span>
                      <strong className="block text-xs">Sewa · Paket · Beli</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-border/65 bg-background/65 px-3 py-2.5">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <PackageCheck className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9px] font-medium text-muted-foreground">
                        Layanan digital
                      </span>
                      <strong className="block text-xs">Akasha Smart Booking</strong>
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90"
                  >
                    Hubungi Akasha <MessageCircle className="size-3.5" />
                  </a>
                  <a
                    href={MAP_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Lihat lokasi Akasha di peta"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/35 hover:text-primary"
                  >
                    <ArrowUpRight className="size-4" />
                  </a>
                </div>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
