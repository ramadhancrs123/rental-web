import Link from "next/link"
import Image from "next/image"
import { Mountain, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchCatalog } from "@/lib/catalog"
import { formatRupiah } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Katalog | Akasha Outdoor Rent",
  description: "Daftar perlengkapan outdoor yang tersedia untuk disewa.",
}

export default async function KatalogPage() {
  const { items } = await fetchCatalog().catch(() => ({ usahaNama: null, items: [] }))

  const byCategory = new Map<string, typeof items>()
  for (const item of items) {
    const list = byCategory.get(item.kategori_nama) ?? []
    list.push(item)
    byCategory.set(item.kategori_nama, list)
  }
  const categories = [...byCategory.keys()].sort()

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative flex h-[42vh] min-h-72 items-center justify-center overflow-hidden pt-20">
        <Image
          src="/bg.webp"
          alt="Katalog Akasha Outdoor Rent"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/55 via-foreground/35 to-foreground/65" />
        <div className="relative z-10 text-center text-primary-foreground">
          <h1 className="mb-2 text-4xl font-medium tracking-tight md:text-6xl">
            Katalog{" "}
            <span className="font-display italic text-[oklch(0.78_0.15_60)]">Outdoor</span>
          </h1>
          <p className="text-lg opacity-85">
            Pilih perlengkapan, tentukan tanggal, dan booking online.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        {items.length === 0 ? (
          <div className="mx-auto mt-16 max-w-lg rounded-3xl border border-border/60 bg-card p-10 text-center">
            <Mountain className="mx-auto size-10 text-primary/40" />
            <h2 className="mt-4 text-lg font-semibold">Katalog masih kosong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Perlengkapan kami sedang disiapkan. Hubungi admin via WhatsApp
              untuk info terbaru.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((kategori) => (
              <div key={kategori}>
                <h2 className="mb-4 text-sm font-medium tracking-widest text-muted-foreground uppercase">
                  {kategori}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {byCategory.get(kategori)!.map((item) => (
                    <article
                      key={item.barang_id}
                      className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight">
                            {item.nama}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.ringkasan_publik ?? item.deskripsi ?? "Siap disewa untuk petualanganmu."}
                          </p>
                        </div>
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent">
                          <Mountain className="size-6 text-primary/50" />
                        </div>
                      </div>

                      <ul className="divide-y divide-border/50 border-y border-border/50">
                        {item.variants.map((v) => (
                          <li key={v.varian_barang_id} className="py-3">
                            <span className="flex items-center justify-between gap-3 text-sm">
                              <span className="truncate font-normal">{v.nama}</span>
                              <span className="font-semibold text-primary">
                                {v.price !== null ? formatRupiah(v.price) : "-"}
                                <span className="text-xs font-normal text-muted-foreground">
                                  {" "}/ hari
                                </span>
                              </span>
                            </span>
                            {v.deskripsi && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {v.deskripsi}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>

                      <Link href="/booking" className="mt-auto">
                        <Button className="h-10 w-full rounded-full text-sm font-medium">
                          Pesan Sekarang
                        </Button>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="size-4" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
