import { Quote, Star } from "lucide-react"
import type { PublicTestimonial } from "@/lib/testimonials"

function formatPublishedDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Penyewa Akasha"
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date)
}

export default function TestimonialCard({ item }: { item: PublicTestimonial }) {
  return (
    <article className="flex h-full min-h-[220px] flex-col rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lg sm:min-h-[238px] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300" aria-label={`Rating ${item.rating} dari 5`}>
          <Star className="size-3.5 fill-current" /> {item.rating.toFixed(1)}
        </span>
        <Quote className="size-5 text-primary/45" aria-hidden="true" />
      </div>
      <p className="mt-5 flex-1 whitespace-pre-line text-sm leading-6 text-foreground/85">“{item.isi}”</p>
      <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">{item.nama_tampilan.trim().slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.nama_tampilan}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.konteks?.trim() || "Penyewa Akasha"} · {formatPublishedDate(item.published_at)}</p>
        </div>
      </div>
    </article>
  )
}
