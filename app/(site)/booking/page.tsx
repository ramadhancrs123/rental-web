import { fetchCatalog } from "@/lib/catalog"

import BookingForm from "./booking-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Booking | Akasha Outdoor Rent",
  description: "Isi form booking untuk menyewa perlengkapan outdoor pilihanmu.",
}

export default async function BookingPage() {
  const { items } = await fetchCatalog().catch(() => ({ usahaNama: null, items: [] }))

  const bookable = items.flatMap((item) =>
    item.variants
      .filter((v) => v.price !== null)
      .map((v) => ({
        varian_barang_id: v.varian_barang_id,
        nama: v.nama,
        barang_nama: v.barang_nama,
        kategori_nama: item.kategori_nama,
        price: v.price as number,
      }))
  )

  return (
    <div className="bg-background">
      <section className="relative pt-24 pb-10">
        <div className="pointer-events-none absolute -top-32 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-medium tracking-tight md:text-5xl">
            Form <span className="font-display italic text-primary">Booking</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Isi data penyewa, pilih tanggal & perlengkapan. Reservasi kamu akan
            dicek admin dan dikonfirmasi via WhatsApp.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24">
        {bookable.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card p-10 text-center">
            <h2 className="text-lg font-semibold">Belum ada item yang bisa dipesan</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hubungi admin via WhatsApp untuk pemesanan manual.
            </p>
          </div>
        ) : (
          <BookingForm items={bookable} />
        )}
      </section>
    </div>
  )
}
