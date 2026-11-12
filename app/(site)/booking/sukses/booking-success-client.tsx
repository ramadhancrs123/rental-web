"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check, Clipboard, Download, ExternalLink, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react"
import { formatRupiah, WA_NUMBER } from "@/lib/supabase"
import { calculateRentalEstimate, calculateTariffPeriodsForDates, formatRentalStayLabel } from "@/lib/rental-estimate"
import { createAdminWhatsappUrl } from "@/lib/akasha-smart-booking/admin-whatsapp"
import { createBookingReceiptQr, exportBookingReceipt, type BookingReceipt } from "@/lib/akasha-smart-booking/booking-receipt"

const SUCCESS_KEY = "akasha-smart-booking-success-v1"

export default function BookingSuccessClient() {
  const [data, setData] = useState<BookingReceipt | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(SUCCESS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as BookingReceipt
          if (parsed.reference_code && Array.isArray(parsed.lines)) setData(parsed)
        }
      } catch {
        setError("Bukti booking belum berhasil dibuka. Muat ulang halaman atau hubungi admin untuk bantuan.")
      }
      setLoading(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let active = true
    if (!data) return
    const target = data.portal_link_url || (window.location.origin + "/booking/portal")
    void createBookingReceiptQr(target)
      .then((url) => { if (active) setQrDataUrl(url) })
      .catch(() => { if (active) setError("Kode QR belum tersedia. Anda tetap dapat membuka portal melalui tautan atau kode akses di bawah.") })
    return () => { active = false }
  }, [data])

  const filename = useMemo(() => data ? "AKASHA-BOOKING-" + data.reference_code.replace(/[^a-z0-9-]/gi, "-") : "AKASHA-BOOKING", [data])
  const adminWhatsappUrl = useMemo(() => data ? createAdminWhatsappUrl(WA_NUMBER, data) : "", [data])
  const estimatedTotal = useMemo(() => data ? data.lines.reduce((sum, line) => {
    const periods = line.kind === "rental" && data.pickup_date && data.return_date
      ? calculateTariffPeriodsForDates(data.pickup_date, data.return_date, line.durationValue, line.durationUnit) ?? 1
      : 1
    return sum + calculateRentalEstimate(line.quantity, line.price, periods)
  }, 0) : 0, [data])

  async function exportReceipt(kind: "png" | "pdf") {
    if (!data || !qrDataUrl || exporting) return
    setExporting(kind)
    setError("")
    try {
      await exportBookingReceipt(data, qrDataUrl, kind, filename)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nota belum dapat diunduh.")
    } finally {
      setExporting(null)
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Salin otomatis tidak tersedia. Tekan dan tahan teks untuk menyalin.")
    }
  }

  if (loading) {
    return <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground"><LoaderCircle className="mr-2 inline size-4 animate-spin" /> Menyiapkan bukti booking...</div>
  }

  if (!data) {
    return (
      <section className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl border border-border/70 bg-card p-6 text-center">
          <ShieldCheck className="mx-auto size-9 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Bukti booking tidak tersedia</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Bukti booking belum tersedia di perangkat ini. Silakan buka portal customer menggunakan kode akses booking Anda atau hubungi admin untuk bantuan.</p>
          {error ? <p role="alert" className="mt-3 text-xs text-destructive">{error}</p> : null}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center"><Link href="/booking/portal" className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold">Cek booking</Link><Link href="/katalog" className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Kembali ke katalog</Link></div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
      <header className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.055] p-5 sm:p-7">
        <div className="mb-4 flex items-center gap-2 border-b border-emerald-500/15 pb-3">
          <Image src="/logo.png" alt="Akasha Outdoor" width={28} height={28} className="size-7 shrink-0 object-contain" />
          <div>
            <p className="text-[11px] font-bold tracking-[0.08em] text-foreground">AKASHA <span className="text-primary">SMART</span> BOOKING</p>
            <p className="text-[9px] font-medium tracking-[0.12em] text-muted-foreground">AKASHA OUTDOOR</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300"><span className="grid size-9 place-items-center rounded-full bg-emerald-500/10"><Check className="size-5" /></span><span className="text-xs font-semibold">Booking berhasil dikirim</span></div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Terima kasih, {data.customer_name}.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Simpan bukti dan akses portal booking Anda.</p>
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4 rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Kode reservasi</p><div className="mt-1 flex items-center justify-between gap-2"><code className="break-all text-xl font-bold tracking-wide">{data.reference_code}</code><button type="button" onClick={() => void copy(data.reference_code)} aria-label="Salin kode reservasi" className="grid size-9 shrink-0 place-items-center rounded-full border border-border"><Clipboard className="size-4" /></button></div></div>

          <div className="border-t border-border/60 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Kode akses customer</p>
            {data.access_code ? <div className="mt-1 flex items-center justify-between gap-2"><code className="break-all text-2xl font-bold tracking-[0.16em] text-primary">{data.access_code}</code><button type="button" onClick={() => void copy(data.access_code as string)} aria-label="Salin kode akses" className="grid size-9 shrink-0 place-items-center rounded-full border border-border"><Clipboard className="size-4" /></button></div> : <p className="mt-2 rounded-xl bg-amber-500/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-200">Kode akses belum tersedia. Hubungi admin dengan menyertakan kode booking Anda.</p>}
          </div>

          <div className="border-t border-border/60 pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Tautan portal pribadi</p>
            {data.portal_link_url ? <><p className="mt-1 break-all text-xs font-medium text-primary">{data.portal_link_url}</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => void copy(data.portal_link_url as string)} className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold"><Clipboard className="size-3.5" /> Salin tautan</button><a href={data.portal_link_url} className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground">Buka portal <ExternalLink className="size-3.5" /></a></div></> : <p className="mt-2 text-xs leading-5 text-muted-foreground">Gunakan kode akses di atas untuk masuk ke portal customer. Hubungi admin apabila Anda membutuhkan bantuan.</p>}
          </div>

          <div className="border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Status saat ini</span><strong className="text-xs">Menunggu peninjauan</strong></div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm"><span className="text-muted-foreground">Estimasi biaya</span><strong>{formatRupiah(estimatedTotal)}</strong></div>
            {data.pickup_date && data.return_date ? <p className="mt-1 text-[10px] text-muted-foreground">Durasi {formatRentalStayLabel(data.pickup_date, data.return_date) ?? data.stay_duration_label ?? "—"}.</p> : null}
            <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Biaya ini masih berupa perkiraan. Admin akan mengonfirmasi barang, jadwal, dan total akhir sebelum transaksi.</p>
          </div>

          {error ? <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void exportReceipt("png")} disabled={!qrDataUrl || exporting !== null} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-3 text-xs font-semibold disabled:opacity-50"><Download className="size-4" /> {exporting === "png" ? "Menyiapkan..." : "Unduh PNG"}</button>
            <button type="button" onClick={() => void exportReceipt("pdf")} disabled={!qrDataUrl || exporting !== null} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Download className="size-4" /> {exporting === "pdf" ? "Menyiapkan..." : "Unduh PDF"}</button>
          </div>
          <p className="rounded-xl bg-muted/45 px-3 py-2.5 text-center text-[11px] leading-5 text-muted-foreground">Unduh PNG/PDF dan kirim ke WhatsApp admin untuk konfirmasi.</p>
          {adminWhatsappUrl ? <a href={adminWhatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#16784b] px-4 text-xs font-semibold text-white transition hover:bg-[#12663f]"><MessageCircle className="size-4" /> Konfirmasi ke WhatsApp Admin</a> : <p role="status" className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-center text-xs text-amber-800">Nomor WhatsApp admin belum tersedia. Hubungi pengelola secara langsung.</p>}
          {copied ? <p role="status" className="text-center text-[10px] text-emerald-700 dark:text-emerald-300">Berhasil disalin.</p> : null}
        </div>

        <aside className="rounded-3xl border border-border/70 bg-card p-4 text-center">
          <p className="text-xs font-semibold">QR portal customer</p>
          {qrDataUrl ? <Image src={qrDataUrl} alt="QR portal booking pribadi" width={220} height={220} unoptimized className="mx-auto mt-3 aspect-square w-full max-w-[220px] rounded-xl border border-border/60 bg-white p-2" /> : <div className="mx-auto mt-3 grid aspect-square w-full max-w-[220px] place-items-center rounded-xl border border-dashed text-xs text-muted-foreground"><LoaderCircle className="size-5 animate-spin" /></div>}
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Pindai untuk membuka portal. Jangan bagikan QR atau tautan ini kepada orang lain.</p>
          <div className="mt-4 grid gap-2"><Link href={data.portal_link_url ?? "/booking/portal"} className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground">Pantau booking <ArrowRight className="ml-1 size-3.5" /></Link><Link href="/katalog" className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold">Kembali ke katalog</Link></div>
        </aside>
      </div>
    </section>
  )
}
