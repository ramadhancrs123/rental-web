import Link from "next/link"
import { ArrowLeft, ArrowUpRight, MessageCircle, ShieldCheck } from "lucide-react"

export const metadata = {
  title: "Booking | Akasha Outdoor Rent",
  description: "Hubungi pengelola Akasha untuk melakukan pemesanan perlengkapan outdoor.",
}

const WHATSAPP_URL = "https://wa.me/6287864959365?text=" + encodeURIComponent(
  "Halo Akasha Outdoor Rent, saya ingin melakukan booking perlengkapan outdoor. Mohon informasi ketersediaan dan tarifnya."
)

export default function BookingSuksesPage() {
  return (
    <div className="min-h-[70vh] bg-background px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke beranda
        </Link>
        <div className="mt-8 rounded-[2rem] border border-border/70 bg-card p-6 shadow-xl shadow-slate-950/5 sm:p-10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-7" /></span>
          <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-primary uppercase">Pemesanan online</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Form booking belum tersedia.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Halaman konfirmasi booking online sedang dinonaktifkan selama fitur pemesanan dikembangkan. Belum ada booking yang dibuat melalui halaman ini. Hubungi pengelola untuk memeriksa ketersediaan dan melakukan pemesanan.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#167e57] px-6 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#126c4a]">
              <MessageCircle className="size-4" /> Hubungi pengelola <ArrowUpRight className="size-4" />
            </a>
            <Link href="/katalog" className="inline-flex h-12 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold transition hover:bg-muted">
              Kembali ke katalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
