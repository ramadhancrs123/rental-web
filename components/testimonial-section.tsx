import Link from "next/link"
import { ArrowRight, MessageSquareQuote } from "lucide-react"
import ScrollReveal from "@/components/scroll-reveal"
import LazyTestimonialCarousel from "@/components/lazy-testimonial-carousel"
import TestimonialForm from "@/components/testimonial-form"
import type { PublicTestimonial } from "@/lib/testimonials"

export function TestimonialCards({ items }: { items: PublicTestimonial[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/55 px-4 py-6 text-center sm:px-6 sm:py-8">
        <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageSquareQuote className="size-5" /></span>
        <h3 className="mt-3 text-sm font-semibold">Cerita petualang segera hadir</h3>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-muted-foreground">Belum ada cerita. Bagikan pengalaman pertama Anda bersama Akasha.</p>
      </div>
    )
  }

  return <LazyTestimonialCarousel items={items} />
}

export default function TestimonialSection({ items, total }: { items: PublicTestimonial[]; total: number }) {
  return (
    <section id="cerita-pelanggan" className="scroll-mt-24 border-y border-border/60 bg-secondary/35 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="section-eyebrow"><MessageSquareQuote className="size-3.5" /> Cerita petualang</span>
              <h2 className="mt-3 text-2xl leading-[1.12] font-semibold tracking-tight text-balance sm:text-3xl lg:text-4xl">Pengalaman nyata, <span className="font-display font-normal text-primary italic">dari para penyewa.</span></h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-sm">Ulasan pelanggan Akasha.</p>
            </div>
            {total > 3 && <Link href="/testimoni" className="group inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition hover:gap-3">Baca semua cerita <ArrowRight className="size-4" /></Link>}
          </div>
        </ScrollReveal>

        <div className="mt-6"><TestimonialCards items={items} /></div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{total === 0 ? "Belum ada cerita yang dibagikan." : total + " cerita telah dibagikan oleh para penyewa."}</p>
          {total > 3 && <Link href="/testimoni" className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary">Jelajahi arsip cerita <ArrowRight className="size-3.5" /></Link>}
        </div>

        <div className="mt-6">
          <details className="group rounded-2xl border border-border/60 bg-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageSquareQuote className="size-5" /></span><span><span className="block text-sm font-semibold">Bagikan pengalaman Anda</span><span className="mt-0.5 block text-xs text-muted-foreground">Cerita tampil setelah disetujui.</span></span></span>
              <span className="text-xs font-semibold text-primary group-open:hidden">Tulis cerita</span><span className="hidden text-xs font-semibold text-primary group-open:inline">Tutup</span>
            </summary>
            <div className="border-t border-border/60 p-3 sm:p-5"><TestimonialForm /></div>
          </details>
        </div>
      </div>
    </section>
  )
}
