"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ArrowUpRight, CheckCircle2, ExternalLink, MessageCircle, Mountain, Tent, X } from "lucide-react"
import { cn } from "@/lib/utils"

const WHATSAPP_URL = "https://wa.me/6287864959365?text=" + encodeURIComponent("Halo Akasha Outdoor Rent, saya ingin melakukan booking perlengkapan outdoor. Mohon informasi ketersediaan dan tarifnya.")

type BookingNoticeDialogProps = {
  label?: string
  className?: string
  icon?: boolean
  ariaLabel?: string
  purpose?: "rental" | "hiking-ticket"
  itemName?: string
  officialBookingUrl?: string | null
}

export default function BookingNoticeDialog({
  label = "Pesan Sekarang",
  className,
  icon = true,
  ariaLabel,
  purpose = "rental",
  itemName,
  officialBookingUrl,
}: BookingNoticeDialogProps) {
  const isHikingTicket = purpose === "hiking-ticket"
  const safeOfficialUrl = officialBookingUrl?.startsWith("https://") ? officialBookingUrl : null

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger aria-label={ariaLabel || undefined} className={cn("cursor-pointer", className)}>
        {label}{icon && <ArrowUpRight className="size-4" aria-hidden="true" />}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[3px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] border border-border/70 bg-card p-5 text-card-foreground shadow-2xl shadow-slate-950/25 transition duration-300 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{isHikingTicket ? <Mountain className="size-6" /> : <Tent className="size-6" />}</span>
            <DialogPrimitive.Close aria-label="Tutup dialog" className="grid size-9 shrink-0 place-items-center rounded-full border border-border/70 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-4" /></DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
            {isHikingTicket ? "Pemesanan tiket pendakian belum tersedia" : "Pemesanan online sedang dikembangkan"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted-foreground">
            {isHikingTicket
              ? (itemName ? "Integrasi pemesanan tiket untuk " + itemName + " belum diaktifkan di Akasha." : "Integrasi pemesanan tiket pendakian belum diaktifkan di Akasha.") + " Gunakan kanal resmi pengelola destinasi untuk memastikan kuota, tarif, dan ketentuan terbaru."
              : "Fitur pemesanan online sedang dalam pengembangan. Hubungi pengelola untuk melakukan booking."}
          </DialogPrimitive.Description>
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[0.06] p-3.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs leading-5 text-muted-foreground">
              {isHikingTicket
                ? "Tombol ini tidak membuat reservasi, tidak menahan kuota, dan bukan konfirmasi tiket. Informasi destinasi tetap mengikuti data yang dipublikasikan serta sumber resminya."
                : "Pengelola akan membantu mengonfirmasi ketersediaan perlengkapan, tarif, tanggal sewa, serta ketentuan serah-terima."}
            </p>
          </div>
          {isHikingTicket ? (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {safeOfficialUrl ? (
                <a href={safeOfficialUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ExternalLink className="size-4" /> Kanal resmi pengelola</a>
              ) : (
                <DialogPrimitive.Close className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2">Mengerti</DialogPrimitive.Close>
              )}
              {safeOfficialUrl && <DialogPrimitive.Close className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold transition duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Tutup</DialogPrimitive.Close>}
            </div>
          ) : (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#167e57] px-4 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-[#126c4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><MessageCircle className="size-4" /> Hubungi pengelola</a>
              <DialogPrimitive.Close className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold transition duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Nanti saja</DialogPrimitive.Close>
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
