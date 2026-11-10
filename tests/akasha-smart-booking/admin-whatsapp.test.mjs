import assert from "node:assert/strict"
import test from "node:test"
import { createAdminWhatsappUrl } from "../../lib/akasha-smart-booking/admin-whatsapp.ts"

const booking = {
  reference_code: "AKS-20261110-001",
  customer_name: "Nurdin",
  customer_phone: "081234567890",
  pickup_date: "2026-11-12",
  return_date: "2026-11-14",
  total_estimate: 175000,
  lines: [
    { kind: "rental", name: "Tenda Dome", variant: "4P", quantity: 1 },
    { kind: "sale", name: "Gas Portable", variant: null, quantity: 2 },
  ],
}

test("admin WhatsApp message contains the booking reference and customer summary", () => {
  const url = new URL(createAdminWhatsappUrl("+62 878-6495-9365", booking))
  assert.equal(url.origin + url.pathname, "https://wa.me/6287864959365")
  const message = url.searchParams.get("text") ?? ""
  assert.match(message, /Kode reservasi: AKS-20261110-001/)
  assert.match(message, /Nama: Nurdin/)
  assert.match(message, /Sewa: Tenda Dome · 4P × 1/)
  assert.match(message, /Beli: Gas Portable × 2/)
  assert.match(message, /Estimasi biaya: Rp\s?175\.000/)
})

test("admin WhatsApp URL is omitted when recipient or booking code is missing", () => {
  assert.equal(createAdminWhatsappUrl("", booking), "")
  assert.equal(createAdminWhatsappUrl("6287864959365", { ...booking, reference_code: " " }), "")
})

test("booking dates are presented in a customer-readable format", () => {
  const url = new URL(createAdminWhatsappUrl("6287864959365", booking))
  const message = url.searchParams.get("text") ?? ""
  assert.match(message, /Tanggal ambil: 12 November 2026/)
  assert.match(message, /Tanggal kembali: 14 November 2026/)
})
