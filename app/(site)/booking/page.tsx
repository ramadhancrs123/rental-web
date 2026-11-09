import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import BookingForm from "./booking-form"
import { fetchCatalog } from "@/lib/catalog"

export const metadata = {
  title: "Booking | Akasha Outdoor Rent",
  description: "Ajukan permintaan rental dan pembelian perlengkapan outdoor Akasha.",
}

type BookingSearchParams = {
  add?: string | string[]
  item?: string | string[]
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<BookingSearchParams>
}) {
  const params = await searchParams
  const initialAdd = Array.isArray(params.add) ? params.add[0] : params.add ?? null
  const focusItemId = Array.isArray(params.item) ? params.item[0] : params.item ?? null
  let catalog
  try {
    catalog = await fetchCatalog()
  } catch {
    return (
      <main className="min-h-[70vh] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/katalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Kembali ke katalog</Link>
          <div role="alert" className="mt-6 rounded-3xl border border-destructive/25 bg-destructive/[0.04] p-6">
            <h1 className="text-xl font-semibold">Katalog booking belum dapat dimuat</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Data produk dan tarif belum dapat dibaca dari layanan katalog. Tidak ada permintaan yang dikirim. Silakan coba kembali atau hubungi pengelola.</p>
          </div>
        </div>
      </main>
    )
  }

  const bookableCount = catalog.items.reduce(
    (sum, item) => sum + (item.directRentalOption ? 1 : 0) + item.variants.length,
    0,
  ) + catalog.packages.filter((item) => item.canBook).length + catalog.sales.length

  return (
    <main className="min-h-[70vh] bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/katalog" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Kembali ke katalog</Link>
        <header className="mt-6 rounded-3xl border border-border/70 bg-card p-5 sm:p-7">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Permintaan online</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Ajukan booking Akasha</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pilih rental, paket, atau barang pembelian. Permintaan akan dicatat untuk ditinjau pengelola. Stok tidak dikunci dan ketersediaan belum dijamin.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
            <p className="text-xs text-muted-foreground">{bookableCount} opsi tersedia dari katalog publik.</p>
            <Link href="/booking/portal" className="text-xs font-semibold text-primary underline underline-offset-4">
              Sudah punya booking? Cek status
            </Link>
          </div>
        </header>
        <div className="mt-5">
          <BookingForm catalog={catalog} initialAdd={initialAdd} focusItemId={focusItemId} />
        </div>
      </div>
    </main>
  )
}
