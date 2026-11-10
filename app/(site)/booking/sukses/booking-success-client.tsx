"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import QRCode from "qrcode"
import { ArrowRight, Check, Clipboard, Download, ExternalLink, LoaderCircle, MessageCircle, ShieldCheck } from "lucide-react"
import { formatRupiah, WA_NUMBER } from "@/lib/supabase"
import { calculateRentalEstimate, calculateTariffPeriodsForDates, formatRentalStayLabel } from "@/lib/rental-estimate"
import { createAdminWhatsappUrl } from "@/lib/akasha-smart-booking/admin-whatsapp"

const SUCCESS_KEY = "akasha-smart-booking-success-v1"

type ReceiptLine = {
  id: string
  kind: "rental" | "sale"
  name: string
  category: string
  variant: string | null
  quantity: number
  price: number
  normalPrice: number
  discountPercent: number
  durationValue: number | null
  durationUnit: string | null
}

type BookingReceipt = {
  reference_code: string
  access_code: string | null
  portal_link_url: string | null
  credential_requires_rotation: boolean
  workflow_status: string
  total_estimate: number
  currency_code: string
  customer_name: string
  customer_phone: string
  pickup_date: string | null
  return_date: string | null
  stay_duration_label?: string | null
  lines: ReceiptLine[]
  created_at: string
}

function drawWrapped(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/)
  let line = ""
  let nextY = y
  for (const word of words) {
    const candidate = line ? line + " " + word : word
    if (context.measureText(candidate).width > maxWidth && line) {
      context.fillText(line, x, nextY)
      line = word
      nextY += lineHeight
    } else {
      line = candidate
    }
  }
  if (line) {
    context.fillText(line, x, nextY)
    nextY += lineHeight
  }
  return nextY
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}

async function createReceiptCanvas(data: BookingReceipt, qrDataUrl: string | null) {
  const width = 900
  const height = 1260 + data.lines.length * 78 + (data.portal_link_url ? 150 : 40)
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Perangkat tidak dapat membuat gambar nota.")

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)
  context.fillStyle = "#172a35"
  context.fillRect(0, 0, width, 14)

  let y = 78
  try {
    const logo = await loadImage("/logo.png")
    context.drawImage(logo, 72, y - 10, 100, 100)
  } catch {
    context.fillStyle = "#172a35"
    context.font = "bold 34px Arial"
    context.fillText("AKASHA", 72, y + 48)
  }

  context.fillStyle = "#172a35"
  context.font = "bold 34px Arial"
  context.fillText("AKASHA OUTDOOR", 200, y + 22)
  context.fillStyle = "#64748b"
  context.font = "22px Arial"
  context.fillText("BUKTI AKASHA SMART BOOKING", 200, y + 58)
  y += 140

  const rule = () => {
    context.strokeStyle = "#dbe2e8"
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(72, y)
    context.lineTo(width - 72, y)
    context.stroke()
    y += 30
  }
  const labelValue = (label: string, value: string, strong = false) => {
    context.fillStyle = "#64748b"
    context.font = "20px Arial"
    context.fillText(label, 72, y)
    context.fillStyle = "#172a35"
    context.font = strong ? "bold 26px Arial" : "24px Arial"
    context.fillText(value, 350, y)
    y += 42
  }

  rule()
  labelValue("Kode reservasi", data.reference_code, true)
  labelValue("Nama pemesan", data.customer_name)
  labelValue("WhatsApp", data.customer_phone)
  labelValue("Tanggal dibuat", new Date(data.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }))
  if (data.pickup_date) labelValue("Pengambilan", data.pickup_date)
  if (data.return_date) labelValue("Pengembalian", data.return_date)
  const stayLabel = data.pickup_date && data.return_date
    ? formatRentalStayLabel(data.pickup_date, data.return_date)
    : data.stay_duration_label ?? null
  if (stayLabel) labelValue("Durasi estimasi", stayLabel, true)
  rule()

  context.fillStyle = "#172a35"
  context.font = "bold 24px Arial"
  context.fillText("RINCIAN PILIHAN", 72, y)
  y += 48
  for (const line of data.lines) {
    context.fillStyle = "#172a35"
    context.font = "bold 23px Arial"
    const heading = (line.kind === "rental" ? "SEWA · " : "BELI · ") + line.name + (line.variant ? " · " + line.variant : "")
    y = drawWrapped(context, heading, 72, y, 560, 30)
    context.fillStyle = "#64748b"
    context.font = "19px Arial"
    const periods = line.kind === "rental" && data.pickup_date && data.return_date
      ? calculateTariffPeriodsForDates(data.pickup_date, data.return_date, line.durationValue, line.durationUnit) ?? 1
      : 1
    const unit = line.kind === "rental" ? " · " + periods + " periode" : " · sekali beli"
    const lineTotal = calculateRentalEstimate(line.quantity, line.price, periods)
    context.fillText(line.quantity + " unit × " + formatRupiah(line.price) + unit, 72, y)
    context.fillStyle = "#172a35"
    context.font = "bold 22px Arial"
    context.textAlign = "right"
    context.fillText(formatRupiah(lineTotal), width - 72, y)
    context.textAlign = "left"
    y += 38
    if (line.discountPercent > 0 && line.normalPrice > line.price) {
      context.fillStyle = "#0f766e"
      context.font = "18px Arial"
      context.fillText("Promo " + line.discountPercent + "%", 72, y)
      y += 26
    }
    context.strokeStyle = "#eef1f4"
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(72, y)
    context.lineTo(width - 72, y)
    context.stroke()
    y += 28
  }

  context.fillStyle = "#64748b"
  context.font = "20px Arial"
  const estimatedTotal = data.lines.reduce((sum, line) => {
    const periods = line.kind === "rental" && data.pickup_date && data.return_date
      ? calculateTariffPeriodsForDates(data.pickup_date, data.return_date, line.durationValue, line.durationUnit) ?? 1
      : 1
    return sum + calculateRentalEstimate(line.quantity, line.price, periods)
  }, 0)
  context.fillText("Estimasi biaya booking", 72, y + 6)
  context.fillStyle = "#172a35"
  context.font = "bold 32px Arial"
  context.textAlign = "right"
  context.fillText(formatRupiah(estimatedTotal), width - 72, y + 10)
  context.textAlign = "left"
  y += 72
  rule()

  context.fillStyle = "#172a35"
  context.font = "bold 24px Arial"
  context.fillText("AKSES PORTAL CUSTOMER", 72, y)
  y += 42

  if (data.access_code) {
    context.fillStyle = "#64748b"
    context.font = "20px Arial"
    context.fillText("Kode akses", 72, y)
    context.fillStyle = "#172a35"
    context.font = "bold 36px Arial"
    context.fillText(data.access_code, 260, y + 6)
    y += 66
  } else {
    context.fillStyle = "#b45309"
    context.font = "20px Arial"
    y = drawWrapped(context, "Akses portal belum tersedia. Hubungi admin dengan menyertakan kode booking ini.", 72, y, width - 144, 28) + 16
  }

  if (data.portal_link_url) {
    context.fillStyle = "#64748b"
    context.font = "19px Arial"
    context.fillText("Tautan pribadi", 72, y)
    y += 30
    context.fillStyle = "#1d4ed8"
    context.font = "18px Arial"
    y = drawWrapped(context, data.portal_link_url, 72, y, width - 144, 26) + 16
  }

  if (qrDataUrl) {
    const qr = await loadImage(qrDataUrl)
    context.drawImage(qr, Math.round((width - 240) / 2), y + 12, 240, 240)
    y += 285
  }

  context.fillStyle = "#172a35"
  context.font = "bold 22px Arial"
  context.textAlign = "center"
  context.fillText("Simpan bukti ini dan jaga kerahasiaan akses Anda.", width / 2, y + 4)
  context.fillStyle = "#64748b"
  context.font = "18px Arial"
  context.fillText("Tim Akasha Outdoor akan membantu proses konfirmasi booking Anda.", width / 2, y + 38)
  context.textAlign = "left"
  return canvas
}

function buildImagePdf(canvas: HTMLCanvasElement) {
  const imageUrl = canvas.toDataURL("image/jpeg", 0.94)
  const binary = window.atob(imageUrl.split(",")[1] ?? "")
  const jpeg = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) jpeg[index] = binary.charCodeAt(index)

  const pageWidth = Math.round(canvas.width * 0.72)
  const pageHeight = Math.round(canvas.height * 0.72)
  const commands = "q\n" + pageWidth + " 0 0 " + pageHeight + " 0 0 cm\n/Im0 Do\nQ\n"
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const offsets = new Array<number>(6).fill(0)
  let length = 0
  const add = (value: string | Uint8Array) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value
    chunks.push(bytes)
    length += bytes.length
  }
  const object = (number: number, body: string) => {
    offsets[number] = length
    add(number + " 0 obj\n" + body + "\nendobj\n")
  }

  add("%PDF-1.4\n")
  object(1, "<< /Type /Catalog /Pages 2 0 R >>")
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
  object(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageWidth + " " + pageHeight + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>")

  offsets[4] = length
  add("4 0 obj\n<< /Type /XObject /Subtype /Image /Width " + canvas.width + " /Height " + canvas.height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + jpeg.length + " >>\nstream\n")
  add(jpeg)
  add("\nendstream\nendobj\n")
  offsets[5] = length
  add("5 0 obj\n<< /Length " + encoder.encode(commands).length + " >>\nstream\n" + commands + "endstream\nendobj\n")
  const xrefOffset = length
  add("xref\n0 6\n0000000000 65535 f \n")
  for (let index = 1; index <= 5; index += 1) add(String(offsets[index]).padStart(10, "0") + " 00000 n \n")
  add("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF")
  const output = new Uint8Array(length)
  let cursor = 0
  for (const chunk of chunks) {
    output.set(chunk, cursor)
    cursor += chunk.length
  }
  return new Blob([output], { type: "application/pdf" })
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

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
    void QRCode.toDataURL(target, { errorCorrectionLevel: "M", margin: 1, width: 300, color: { dark: "#172a35", light: "#ffffff" } })
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
    if (!data || exporting) return
    setExporting(kind)
    setError("")
    try {
      const canvas = await createReceiptCanvas(data, qrDataUrl)
      if (kind === "png") {
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gambar nota tidak dapat dibuat.")), "image/png"))
        saveBlob(blob, filename + ".png")
      } else {
        saveBlob(buildImagePdf(canvas), filename + ".pdf")
      }
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
