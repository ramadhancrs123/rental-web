"use client"

import { useActionState } from "react"
import { MessageSquareQuote, Send, ShieldCheck } from "lucide-react"
import { submitPublicTestimonial, type PublicTestimonialFormState } from "@/app/actions/testimoni"

const INITIAL_STATE: PublicTestimonialFormState = null

export default function TestimonialForm() {
  const [state, formAction, pending] = useActionState(submitPublicTestimonial, INITIAL_STATE)

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/60 bg-secondary/35 p-5 sm:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageSquareQuote className="size-5" /></span>
        <div>
          <h3 className="text-base font-semibold">Ceritakan pengalamanmu</h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Ulasanmu akan diperiksa admin terlebih dahulu sebelum dipublikasikan.</p>
        </div>
      </div>

      <form action={formAction} className="grid gap-4 p-5 sm:p-6">
        <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="testimonial-website">Website</label>
          <input id="testimonial-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="testimonial-name">
            Nama tampilan
            <input id="testimonial-name" name="nama_tampilan" required minLength={2} maxLength={80} autoComplete="nickname" placeholder="Nama yang boleh ditampilkan" className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium" htmlFor="testimonial-context">
            Perjalanan (opsional)
            <input id="testimonial-context" name="konteks" maxLength={120} placeholder="Mis. Camping bersama keluarga" className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-normal outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" />
          </label>
        </div>

        <label className="grid max-w-xs gap-1.5 text-sm font-medium" htmlFor="testimonial-rating">
          Rating pengalaman
          <select id="testimonial-rating" name="rating" defaultValue="5" className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30">
            <option value="5">★★★★★ · Sangat puas</option>
            <option value="4">★★★★☆ · Puas</option>
            <option value="3">★★★☆☆ · Cukup</option>
            <option value="2">★★☆☆☆ · Kurang puas</option>
            <option value="1">★☆☆☆☆ · Tidak puas</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-medium" htmlFor="testimonial-story">
          Cerita pengalaman
          <textarea id="testimonial-story" name="isi" required minLength={12} maxLength={1200} rows={4} placeholder="Apa yang paling membantu selama menyewa perlengkapan di Akasha?" className="resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-6 font-normal outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" />
          <span className="text-xs font-normal text-muted-foreground">12–1.200 karakter. Jangan sertakan nomor identitas atau informasi sensitif.</span>
        </label>

        {state && (
          <div role="status" aria-live="polite" className={"rounded-xl border px-3.5 py-3 text-sm leading-5 " + (state.status === "success" ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-800 dark:text-emerald-200" : "border-destructive/25 bg-destructive/5 text-destructive")}>
            {state.status === "success" && <ShieldCheck className="mr-1.5 inline size-4 align-[-3px]" />}
            {state.message}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-5 text-muted-foreground">Dengan mengirim, kamu mengizinkan Akasha meninjau cerita ini untuk kemungkinan publikasi. Nama tampilan yang kamu tulis dapat ditampilkan jika disetujui.</p>
          <button type="submit" disabled={pending} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90 disabled:pointer-events-none disabled:opacity-60">
            <Send className="size-4" /> {pending ? "Mengirim…" : "Kirim untuk ditinjau"}
          </button>
        </div>
      </form>
    </div>
  )
}
