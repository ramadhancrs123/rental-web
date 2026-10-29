import Link from "next/link"
import { ArrowRight, Quote, Star, MessageSquareQuote } from "lucide-react"
import ScrollReveal from "@/components/scroll-reveal"
import TestimonialForm from "@/components/testimonial-form"
import type { PublicTestimonial } from "@/lib/testimonials"

function formatPublishedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Pelanggan Akasha"
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date)
}

export function TestimonialCards({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-card/55 px-6 py-10 text-center sm:py-12">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageSquareQuote className="size-5" /></span>
        <h3 className="mt-4 text-base font-semibold">Belum ada cerita yang dipublikasikan</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Jadilah salah satu yang pertama berbagi pengalaman. Semua cerita diperiksa admin sebelum tampil di sini.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => (
        <ScrollReveal key={item.testimoni_id} delay={(index % 3) * 0.05}>
          <article className="flex h-full flex-col rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300" aria-label={"Rating " + item.rating + " dari 5"}>
                <Star className="size-3.5 fill-current" /> {item.rating.toFixed(1)}
              </span>
              <Quote className="size-5 text-primary/45" />
            </div>
            <p className="mt-5 flex-1 whitespace-pre-line text-sm leading-6 text-foreground/85">“{item.isi}”</p>
            <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">{item.nama_tampilan.trim().slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.nama_tampilan}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.konteks?.trim() || "Pelanggan Akasha"} · {formatPublishedDate(item.published_at)}</p>
              </div>
            </div>
          </article>
        </ScrollReveal>
      ))}
    </div>
  )
}

export default function TestimonialSection({ items, total }: { items: PublicTestimonial[]; total: number }) {
  return (
    <section id="cerita-pelanggan" className="scroll-mt-24 border-y border-border/60 bg-secondary/35 px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="section-eyebrow"><MessageSquareQuote className="size-3.5" /> Cerita petualang</span>
              <h2 className="mt-4 text-3xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">Pengalaman nyata, <span className="font-display font-normal text-primary italic">dari penyewa.</span></h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">Cerita pelanggan yang telah ditinjau dan disetujui admin Akasha.</p>
            </div>
            {total > 3 && <Link href="/testimoni" className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3">Baca semua cerita <ArrowRight className="size-4" /></Link>}
          </div>
        </ScrollReveal>

        <div className="mt-9"><TestimonialCards items={items} /></div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{total === 0 ? "Belum ada testimoni terverifikasi." : total + " cerita telah disetujui dan dipublikasikan."}</p>
          {total > 3 && <Link href="/testimoni" className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary">Jelajahi arsip testimoni <ArrowRight className="size-3.5" /></Link>}
        </div>

        <div className="mt-10">
          <details className="group rounded-2xl border border-border/60 bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageSquareQuote className="size-5" /></span><span><span className="block text-sm font-semibold">Bagikan pengalamanmu</span><span className="mt-0.5 block text-xs text-muted-foreground">Cerita baru masuk antrean verifikasi, tidak langsung tampil.</span></span></span>
              <span className="text-xs font-semibold text-primary group-open:hidden">Tulis ulasan</span><span className="hidden text-xs font-semibold text-primary group-open:inline">Tutup</span>
            </summary>
            <div className="border-t border-border/60 p-3 sm:p-5"><TestimonialForm /></div>
          </details>
        </div>
      </div>
    </section>
  )
}
