import Link from "next/link"
import { ArrowLeft, ArrowRight, MessageSquareQuote } from "lucide-react"
import { fetchPublicTestimonials } from "@/lib/testimonials"
import { TestimonialCards } from "@/components/testimonial-section"

const PAGE_SIZE = 12
export const dynamic = "force-dynamic"

export default async function TestimonialArchive({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const requested = Number(params.page ?? 1)
  const pageNumber = Number.isFinite(requested) ? Math.max(1, Math.floor(requested)) : 1
  const { items, count } = await fetchPublicTestimonials((pageNumber - 1) * PAGE_SIZE, PAGE_SIZE)
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const currentPage = Math.min(pageNumber, pageCount)

  return (
    <main className="min-h-[65vh] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Link href="/#cerita-pelanggan" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> Kembali ke beranda</Link>
        <div className="mt-8 max-w-2xl">
          <span className="section-eyebrow"><MessageSquareQuote className="size-3.5" /> Cerita pelanggan</span>
          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">Cerita dari <span className="font-display font-normal text-primary italic">petualang Akasha.</span></h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Semua ulasan di halaman ini telah ditinjau dan disetujui admin. Cerita yang menunggu verifikasi tidak ditampilkan.</p>
        </div>
        <div className="mt-9"><TestimonialCards items={items} /></div>
        <div className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{count} testimoni terpublikasi · Halaman {currentPage} dari {pageCount}</p>
          <div className="flex gap-2">
            <Link aria-disabled={currentPage <= 1} tabIndex={currentPage <= 1 ? -1 : undefined} href={currentPage > 1 ? "/testimoni?page=" + (currentPage - 1) : "/testimoni"} className={"inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition hover:bg-muted " + (currentPage <= 1 ? "pointer-events-none opacity-40" : "")}><ArrowLeft className="size-4" /> Sebelumnya</Link>
            <Link aria-disabled={currentPage >= pageCount} tabIndex={currentPage >= pageCount ? -1 : undefined} href={currentPage < pageCount ? "/testimoni?page=" + (currentPage + 1) : "/testimoni?page=" + pageCount} className={"inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition hover:bg-muted " + (currentPage >= pageCount ? "pointer-events-none opacity-40" : "")}>Berikutnya <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </div>
    </main>
  )
}
