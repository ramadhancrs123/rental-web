import QRCode from "qrcode"
import { calculateRentalEstimate, calculateTariffPeriodsForDates, formatRentalStayLabel } from "@/lib/rental-estimate"
import { formatRupiah } from "@/lib/supabase"


export type BookingReceiptLine = {
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

export type BookingReceipt = {
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
  lines: BookingReceiptLine[]
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

function countWrappedLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  let lines = 0
  let line = ""
  for (const word of text.split(/\s+/)) {
    const candidate = line ? line + " " + word : word
    if (context.measureText(candidate).width > maxWidth && line) {
      lines += 1
      line = word
    } else {
      line = candidate
    }
  }
  return lines + (line ? 1 : 0)
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = source
  })
}


function formatReceiptDate(value: string | null) {
  if (!value) return "—"
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

async function createBookingReceiptCanvas(data: BookingReceipt, qrDataUrl: string | null) {
  if ("fonts" in document) await document.fonts.ready

  const width = 1000
  const padding = 72
  const right = width - padding
  const contentWidth = right - padding
  const font = getComputedStyle(document.body).fontFamily || '"Inter", "Arial", sans-serif'
  const measureCanvas = document.createElement("canvas")
  const measureContext = measureCanvas.getContext("2d")
  if (!measureContext) throw new Error("Perangkat tidak dapat menyiapkan tata letak nota.")
  measureContext.font = "700 21px " + font
  const itemHeight = data.lines.reduce((heightSum, line) => {
    const heading = line.name + (line.variant ? " · " + line.variant : "")
    return heightSum
      + 127
      + Math.max(0, countWrappedLines(measureContext, heading, 640) - 1) * 27
      + (line.discountPercent > 0 && line.normalPrice > line.price ? 21 : 0)
  }, 0)
  measureContext.font = "500 12px " + font
  const linkExtraHeight = data.portal_link_url
    ? Math.max(0, countWrappedLines(measureContext, data.portal_link_url, 490) - 5) * 18
    : 0
  const height = 1160 + itemHeight + (data.portal_link_url ? 150 : 0) + linkExtraHeight
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")
  if (!context) throw new Error("Perangkat tidak dapat membuat gambar nota.")

  const navy = "#14283a"
  const ink = "#1f2937"
  const muted = "#64748b"
  const faint = "#e2e8f0"
  const soft = "#f5f7fa"
  const orange = "#e87516"
  const green = "#0f766e"

  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, width, height)

  const setFont = (weight: number, size: number, style = "") => {
    context.font = (style ? style + " " : "") + weight + " " + size + "px " + font
  }

  const drawRule = (y: number, color = faint, lineWidth = 1) => {
    context.strokeStyle = color
    context.lineWidth = lineWidth
    context.beginPath()
    context.moveTo(padding, y)
    context.lineTo(right, y)
    context.stroke()
  }

  const rightText = (text: string, x: number, y: number) => {
    context.textAlign = "right"
    context.fillText(text, x, y)
    context.textAlign = "left"
  }

  const drawField = (label: string, value: string, x: number, y: number, maxWidth: number) => {
    context.fillStyle = muted
    setFont(500, 16)
    context.fillText(label, x, y)
    context.fillStyle = ink
    setFont(650, 19)
    const measured = context.measureText(value).width
    const displayValue = measured > maxWidth
      ? value.slice(0, Math.max(4, Math.floor(value.length * maxWidth / measured) - 1)) + "…"
      : value
    context.fillText(displayValue, x, y + 28)
  }

  const brandLogo = await loadImage("/logo.png").catch(() => null)
  let y = 54

  if (brandLogo) {
    context.drawImage(brandLogo, padding, y - 5, 58, 58)
  } else {
    context.fillStyle = navy
    setFont(750, 24)
    context.fillText("A", padding + 17, y + 34)
  }

  const brandX = padding + 78
  context.fillStyle = navy
  setFont(750, 23)
  context.fillText("AKASHA", brandX, y + 16)
  const akashaWidth = context.measureText("AKASHA").width
  const smartX = brandX + akashaWidth + 12
  context.fillStyle = orange
  setFont(750, 19)
  context.fillText("SMART", smartX, y + 16)
  const smartWidth = context.measureText("SMART").width
  context.fillStyle = navy
  context.fillText("BOOKING", smartX + smartWidth + 7, y + 16)

  context.fillStyle = muted
  setFont(600, 13)
  context.fillText("AKASHA OUTDOOR", brandX, y + 42)

  context.fillStyle = muted
  setFont(500, 15, "italic")
  rightText("Explore · Rent · Climb Better", right, y + 24)

  y += 88
  drawRule(y, navy, 1.5)
  y += 36

  context.fillStyle = muted
  setFont(700, 13)
  context.fillText("KODE RESERVASI", padding, y)
  context.fillStyle = navy
  setFont(750, 39)
  context.fillText(data.reference_code, padding, y + 48)

  const contactX = 600
  context.strokeStyle = faint
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(566, y - 7)
  context.lineTo(566, y + 57)
  context.stroke()

  context.fillStyle = muted
  setFont(500, 15)
  context.fillText(data.customer_phone ? "Kontak WhatsApp" : "DOKUMEN CUSTOMER", contactX, y + 8)
  context.fillStyle = ink
  setFont(700, data.customer_phone ? 25 : 21)
  context.fillText(data.customer_phone || "Akses portal booking", contactX, y + 43)

  y += 88
  drawRule(y)
  y += 35

  const colGap = 46
  const colWidth = (contentWidth - colGap) / 2
  drawField("Nama pemesan", data.customer_name, padding, y, colWidth)
  drawField(
    "Tanggal dibuat",
    new Date(data.created_at).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }),
    padding + colWidth + colGap,
    y,
    colWidth,
  )
  y += 76

  drawField("Pengambilan", formatReceiptDate(data.pickup_date), padding, y, colWidth)
  drawField("Pengembalian", formatReceiptDate(data.return_date), padding + colWidth + colGap, y, colWidth)
  y += 76

  const stayLabel = data.pickup_date && data.return_date
    ? formatRentalStayLabel(data.pickup_date, data.return_date)
    : data.stay_duration_label ?? null
  if (stayLabel) {
    drawField("Durasi estimasi", stayLabel, padding, y, colWidth)
    y += 68
  }

  drawRule(y)
  y += 37

  context.fillStyle = navy
  setFont(750, 20)
  context.fillText("Rincian pilihan", padding, y)
  context.fillStyle = muted
  setFont(500, 13)
  rightText("JUMLAH · TARIF · PERIODE", right, y)
  y += 25
  drawRule(y)
  y += 26

  for (const line of data.lines) {
    const amountX = right - 6
    const textWidth = 640
    const kindLabel = line.kind === "rental" ? "SEWA" : "BELI"
    const heading = line.name + (line.variant ? " · " + line.variant : "")

    context.fillStyle = muted
    setFont(750, 12)
    context.fillText(kindLabel, padding, y)

    context.fillStyle = navy
    setFont(700, 21)
    const headingY = y + 31
    const headingBottom = drawWrapped(context, heading, padding, headingY, textWidth, 27)

    const periods = line.kind === "rental" && data.pickup_date && data.return_date
      ? calculateTariffPeriodsForDates(data.pickup_date, data.return_date, line.durationValue, line.durationUnit) ?? 1
      : 1
    const unitLabel = line.kind === "rental"
      ? "periode"
      : "sekali beli"
    const lineTotal = calculateRentalEstimate(line.quantity, line.price, periods)

    context.fillStyle = muted
    setFont(500, 15)
    context.fillText(
      line.quantity + " unit × " + formatRupiah(line.price) + " · " + (line.kind === "rental" ? periods + " " + unitLabel : unitLabel),
      padding,
      headingBottom + 1,
    )

    context.fillStyle = navy
    setFont(700, 21)
    rightText(formatRupiah(lineTotal), amountX, headingY + 1)

    let rowBottom = headingBottom + 24
    if (line.discountPercent > 0 && line.normalPrice > line.price) {
      context.fillStyle = green
      setFont(600, 13)
      context.fillText("Promo " + line.discountPercent + "%", padding, rowBottom)
      rowBottom += 21
    }

    y = Math.max(rowBottom, headingY + 36) + 20
    drawRule(y)
    y += 25
  }

  const estimatedTotal = data.lines.reduce((sum, line) => {
    const periods = line.kind === "rental" && data.pickup_date && data.return_date
      ? calculateTariffPeriodsForDates(data.pickup_date, data.return_date, line.durationValue, line.durationUnit) ?? 1
      : 1
    return sum + calculateRentalEstimate(line.quantity, line.price, periods)
  }, 0)

  context.fillStyle = muted
  setFont(600, 17)
  context.fillText("Estimasi biaya booking", padding, y + 5)
  context.fillStyle = orange
  setFont(750, 31)
  rightText(formatRupiah(estimatedTotal), right, y + 10)
  y += 61
  drawRule(y, navy, 1.5)
  y += 38

  context.fillStyle = navy
  setFont(750, 19)
  context.fillText("Akses portal customer", padding, y)

  const qrSize = 208
  const qrX = right - qrSize
  const qrY = y + 24

  context.strokeStyle = faint
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(620, y - 7)
  context.lineTo(620, qrY + qrSize + 22)
  context.stroke()

  context.fillStyle = muted
  setFont(500, 15)
  context.fillText("Kode akses", padding, y + 42)

  if (data.access_code) {
    context.fillStyle = soft
    context.fillRect(padding, y + 57, 490, 74)
    context.fillStyle = navy
    setFont(750, 34)
    context.fillText(data.access_code, padding + 24, y + 105)
  } else {
    context.fillStyle = muted
    setFont(500, 14)
    y = drawWrapped(
      context,
      "Kode akses tidak ditampilkan kembali pada salinan ini demi keamanan. Gunakan kode pada bukti booking awal untuk masuk kembali.",
      padding,
      y + 72,
      480,
      22,
    ) + 14
  }

  if (data.portal_link_url) {
    context.fillStyle = muted
    setFont(500, 13)
    context.fillText("Tautan portal pribadi", padding, y + 157)
    context.fillStyle = navy
    setFont(500, 12)
    y = drawWrapped(context, data.portal_link_url, padding, y + 180, 490, 18) + 6
  }

  if (qrDataUrl) {
    const qr = await loadImage(qrDataUrl)
    context.fillStyle = "#ffffff"
    context.fillRect(qrX - 9, qrY - 9, qrSize + 18, qrSize + 18)
    context.strokeStyle = faint
    context.lineWidth = 1
    context.strokeRect(qrX - 9, qrY - 9, qrSize + 18, qrSize + 18)
    context.drawImage(qr, qrX, qrY, qrSize, qrSize)
  }

  context.fillStyle = muted
  setFont(500, 12)
  rightText("Pindai untuk membuka portal", right, qrY + qrSize + 35)

  y = Math.max(y + 16, qrY + qrSize + 59)
  drawRule(y)
  y += 38

  context.fillStyle = navy
  setFont(650, 14)
  context.textAlign = "center"
  context.fillText("Simpan bukti ini dan jaga kerahasiaan kode akses Anda.", width / 2, y)
  context.fillStyle = muted
  setFont(500, 13)
  context.fillText("Bukti digital dari AKASHA SMART BOOKING · AKASHA OUTDOOR", width / 2, y + 26)
  context.textAlign = "left"

  return canvas
}

function buildBookingImagePdf(canvas: HTMLCanvasElement) {
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



export function createBookingReceiptQr(target: string) {
  return QRCode.toDataURL(target, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
    color: { dark: "#172a35", light: "#ffffff" },
  })
}

export async function exportBookingReceipt(
  data: BookingReceipt,
  qrDataUrl: string,
  kind: "png" | "pdf",
  filename: string,
) {
  const canvas = await createBookingReceiptCanvas(data, qrDataUrl)
  if (kind === "png") {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => value
          ? resolve(value)
          : reject(new Error("Gambar nota tidak dapat dibuat.")),
        "image/png",
      )
    })
    saveBlob(blob, filename + ".png")
    return
  }
  saveBlob(buildBookingImagePdf(canvas), filename + ".pdf")
}
