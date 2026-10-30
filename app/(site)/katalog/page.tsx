import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Compass, Package, PackageCheck,
  Sparkles, Tent,
} from "lucide-react"
import BookingNoticeDialog from "@/components/booking-notice-dialog"
import ScrollReveal from "@/components/scroll-reveal"
import { fetchCatalog, catalogCategories, formatRentalDuration } from "@/lib/catalog"
import { formatRupiah } from "@/lib/supabase"

export const metadata = {
  title: "Katalog | Akasha Outdoor Rent",
  description: "Lihat perlengkapan dan paket sewa outdoor Akasha berdasarkan tarif aktif yang dipublikasikan pengelola.",
}

function categoryAnchorId(value: string) {
  return "kategori-" + value.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function PriceLine({
  price,
  durationValue,
  durationUnit,
}: {
  price: number | null
  durationValue: number | null
  durationUnit: string | null
}) {
  if (price === null) {
    return <span className="text-sm font-medium text-muted-foreground">Hubungi pengelola untuk tarif</span>
  }
  const duration = formatRentalDuration(durationValue, durationUnit)
  return (
    <span className="text-base font-bold tracking-tight text-primary sm:text-lg">
      {formatRupiah(price)}
      {duration
        ? <span className="ml-1 text-xs font-normal text-muted-foreground">/ {duration}</span>
        : <span className="ml-1 text-xs font-normal text-muted-foreground">harga dasar</span>}
    </span>
  )
}

export default async function KatalogPage() {
  const { items, packages } = await fetchCatalog().catch(() => ({
    usahaNama: null,
    items: [],
    packages: [],
  }))

  const byCategory = new Map<string, typeof items>()
  for (const item of items) {
    const list = byCategory.get(item.kategori_nama) ?? []
    list.push(item)
    byCategory.set(item.kategori_nama, list)
  }
  const categories = catalogCategories(items)

  return (
    <div className="overflow-clip bg-background text-foreground">
      <section className="relative isolate flex min-h-[330px] items-center overflow-hidden sm:min-h-[390px]">
        <Image src="/bg.webp" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 -z-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/20" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <ScrollReveal>
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-white/75 transition hover:text-white">
              <ArrowLeft className="size-3.5" /> Kembali ke beranda
            </Link>
            <span className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-semibold tracking-[0.16em] text-white/90 uppercase backdrop-blur">
              <Sparkles className="size-3.5 text-orange-300" /> Perlengkapan & paket sewa
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl leading-[1.02] font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
              Temukan perlengkapan untuk <span className="font-display font-normal text-orange-300 italic">langkah berikutnya.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/80 sm:text-base sm:leading-7">
              Jelajahi perlengkapan dan paket sewa dengan informasi serta tarif yang mengikuti konfigurasi aktif di sistem Akasha.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#perlengkapan" className="inline-flex h-11 items-center gap-2 rounded-full bg-orange-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-orange-400">
                Lihat perlengkapan <ArrowRight className="size-4" />
              </a>
              <a href="#paket-sewa" className="inline-flex h-11 items-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20">
                Paket sewa <Package className="size-4" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-b border-border/60 bg-secondary/30 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">Harga mengikuti tarif aktif yang dipublikasikan. Ketersediaan dan jadwal tetap perlu dikonfirmasi pengelola.</p>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <a key={category} href={"#" + categoryAnchorId(category)} className="rounded-full border border-border/70 bg-card px-3.5 py-2 text-xs font-medium transition hover:border-primary/40 hover:text-primary">
                  {category}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="perlengkapan" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="section-eyebrow"><Tent className="size-3.5" /> Katalog perlengkapan</span>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Pilih perlengkapan <span className="font-display font-normal italic text-primary">sesuai kebutuhan.</span>
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Varian dan tarif bersumber dari katalog publik yang dikonfigurasi di panel admin.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground">
                <PackageCheck className="size-3.5 text-primary" /> {items.length} jenis perlengkapan
              </span>
            </div>
          </ScrollReveal>

          {items.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <Package className="mx-auto size-9 text-muted-foreground/55" />
              <h3 className="mt-4 text-lg font-semibold">Katalog sedang disiapkan</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Belum ada perlengkapan aktif yang dipublikasikan. Hubungi pengelola untuk memperoleh informasi terbaru.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {[...byCategory.entries()].map(([category, categoryItems]) => (
                <section id={categoryAnchorId(category)} key={category} className="scroll-mt-28">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Compass className="size-5" /></span>
                    <div>
                      <h3 className="text-base font-semibold">{category}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{categoryItems.length} jenis perlengkapan</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {categoryItems.map((item, index) => (
                      <ScrollReveal key={item.barang_id} delay={(index % 3) * 0.04}>
                        <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-slate-950/5">
                          <div className="product-art relative flex h-40 items-center justify-center overflow-hidden">
                            <div className="product-art__orb absolute -right-8 -bottom-16 size-48 rounded-full bg-primary/10 blur-2xl transition-transform duration-700 group-hover:scale-125" />
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.1] via-transparent to-sky-500/[0.1]" />
                            <div className="absolute top-4 left-4 rounded-full border border-border/40 bg-card/85 px-3 py-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase backdrop-blur">{item.kategori_nama}</div>
                            <Tent className="relative size-16 text-primary/70 transition duration-500 group-hover:scale-110 group-hover:-rotate-3" strokeWidth={1.1} />
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="text-lg font-semibold tracking-tight">{item.nama}</h3>
                            <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.ringkasan_publik ?? item.deskripsi ?? "Perlengkapan outdoor untuk menemani perjalananmu."}</p>
                            <div className="mt-4 divide-y divide-border/60 border-y border-border/60">
                              {item.variants.map((variant) => (
                                <div key={variant.varian_barang_id} className="py-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">{variant.nama}</p>
                                      {variant.deskripsi && <p className="mt-1 text-xs leading-5 text-muted-foreground">{variant.deskripsi}</p>}
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <PriceLine price={variant.price} durationValue={variant.priceDurationValue} durationUnit={variant.priceDurationUnit} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <BookingNoticeDialog label="Pesan Sekarang" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" ariaLabel={"Informasi pemesanan untuk " + item.nama} />
                          </div>
                        </article>
                      </ScrollReveal>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="paket-sewa" className="scroll-mt-24 border-y border-border/60 bg-secondary/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mb-9 max-w-2xl">
              <span className="section-eyebrow"><PackageCheck className="size-3.5" /> Paket sewa</span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Satu pilihan, lebih <span className="font-display font-normal italic text-primary">praktis.</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Paket yang tampil mengikuti status, visibilitas publik, serta tarif yang dikonfigurasi di katalog admin.</p>
            </div>
          </ScrollReveal>
          {packages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center sm:px-10 sm:py-12">
              <Package className="mx-auto size-9 text-muted-foreground/55" />
              <h3 className="mt-4 text-base font-semibold">Belum ada paket sewa yang dipublikasikan</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Paket akan muncul setelah dibuat di katalog admin, diaktifkan, dan ditandai untuk publik. Daftar ini tidak menggunakan paket atau harga contoh.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {packages.map((item, index) => (
                <ScrollReveal key={item.paket_sewa_id} delay={(index % 3) * 0.04}>
                  <article className="flex h-full flex-col rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PackageCheck className="size-6" /></span>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold tracking-[0.1em] text-primary uppercase">Paket sewa</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.nama}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.deskripsi ?? "Rincian paket dapat dikonfirmasi kepada pengelola."}</p>
                    <div className="mt-5 border-t border-border/60 pt-4">
                      <PriceLine price={item.price} durationValue={item.priceDurationValue} durationUnit={item.priceDurationUnit} />
                      {item.priceSource === "harga_dasar" && <p className="mt-1 text-xs leading-5 text-muted-foreground">Harga dasar paket; konfirmasi durasi dan ketentuan kepada pengelola.</p>}
                    </div>
                    <BookingNoticeDialog label="Pesan Sekarang" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" ariaLabel={"Informasi pemesanan paket " + item.nama} />
                  </article>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div><h2 className="font-semibold">Perlu rekomendasi perlengkapan?</h2><p className="mt-1 text-sm text-muted-foreground">Ceritakan rencana perjalananmu, pengelola akan membantu memilihkan opsi yang sesuai.</p></div>
          <a href="https://wa.me/6287864959365?text=Halo%20Akasha%20Outdoor%20Rent%2C%20saya%20ingin%20konsultasi%20perlengkapan%20outdoor." target="_blank" rel="noreferrer" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#167e57] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#126c4a]">Hubungi pengelola <ArrowUpRight className="size-4" /></a>
        </div>
      </section>
    </div>
  )
}
