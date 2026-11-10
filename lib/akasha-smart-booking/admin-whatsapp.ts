export type AdminWhatsappBooking = {
  reference_code: string
  customer_name: string
  customer_phone: string
  pickup_date: string | null
  return_date: string | null
  total_estimate: number
  lines: Array<{
    kind: "rental" | "sale"
    name: string
    variant: string | null
    quantity: number
  }>
}

function formatBookingDate(value: string | null) {
  if (!value) return null
  const date = new Date(value + "T12:00:00Z")
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  }).format(date)
}

function formatBookingAmount(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function createAdminWhatsappUrl(adminPhone: string, booking: AdminWhatsappBooking) {
  const phone = adminPhone.replace(/\D/g, "")
  if (!phone || !booking.reference_code.trim()) return ""

  const items = booking.lines.map((line) =>
    "- " + (line.kind === "rental" ? "Sewa" : "Beli") + ": " + line.name
    + (line.variant ? " · " + line.variant : "")
    + " × " + line.quantity,
  )
  const message = [
    "Halo Admin Akasha Outdoor, saya ingin mengonfirmasi booking.",
    "",
    "Kode reservasi: " + booking.reference_code,
    "Nama: " + booking.customer_name,
    "WhatsApp: " + booking.customer_phone,
    booking.pickup_date ? "Tanggal ambil: " + (formatBookingDate(booking.pickup_date) ?? booking.pickup_date) : null,
    booking.return_date ? "Tanggal kembali: " + (formatBookingDate(booking.return_date) ?? booking.return_date) : null,
    "",
    "Pilihan barang:",
    ...items,
    "",
    "Estimasi biaya: " + formatBookingAmount(booking.total_estimate),
    "",
    "Mohon bantu konfirmasi booking dan informasi selanjutnya. Terima kasih.",
  ].filter((line): line is string => line !== null).join("\n")

  return "https://wa.me/" + phone + "?text=" + encodeURIComponent(message)
}
