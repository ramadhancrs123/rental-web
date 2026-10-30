"use server"

import { redirect } from "next/navigation"
import { getSupabase, USAHA_SLUG } from "@/lib/supabase"

export type BookingResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

type LineInput = { varian_barang_id: string; jumlah: number }

function parseLines(formData: FormData): LineInput[] {
  const lines: LineInput[] = []
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("jumlah_") || typeof raw !== "string") continue
    const varianId = key.slice("jumlah_".length)
    const jumlah = Math.max(0, Math.floor(Number(raw) || 0))
    if (!varianId || jumlah <= 0) continue
    lines.push({ varian_barang_id: varianId, jumlah })
  }
  return lines
}

export async function submitBooking(
  _prev: BookingResult | null,
  formData: FormData
): Promise<BookingResult> {
  const nama = String(formData.get("nama") ?? "").trim()
  const telepon = String(formData.get("telepon") ?? "").trim()
  const catatan = String(formData.get("catatan") ?? "").trim()
  const mulai = String(formData.get("mulai") ?? "")
  const selesai = String(formData.get("selesai") ?? "")

  const fieldErrors: Record<string, string> = {}
  if (nama.length < 2) fieldErrors.nama = "Nama minimal 2 karakter"
  if (telepon.replace(/\D/g, "").length < 8)
    fieldErrors.telepon = "Nomor telepon tidak valid"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mulai)) fieldErrors.mulai = "Tanggal mulai wajib diisi"
  if (!/^\d{4}-\d{2}-\d{2}$/.test(selesai)) fieldErrors.selesai = "Tanggal selesai wajib diisi"

  const lines = parseLines(formData)
  if (lines.length === 0)
    fieldErrors.lines = "Pilih minimal 1 item sewa"

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Periksa kembali isian formulir.", fieldErrors }
  }

  const idempotencyKey = String(formData.get("idempotency_key") ?? "").trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    return {
      ok: false,
      error: "Sesi pengiriman tidak valid. Muat ulang formulir, lalu coba kembali.",
    }
  }

  const payload = {
    nama,
    telepon,
    catatan: catatan || null,
    mulai_rencana: mulai,
    selesai_rencana: selesai,
    lines,
  }

  const sb = getSupabase()

  const { data, error } = await sb.rpc("command_create_website_booking", {
    p_slug: USAHA_SLUG,
    p_booking: payload,
    p_idempotency_key: idempotencyKey,
  })

  if (error || !data) {
    return {
      ok: false,
      error:
        error?.message ??
        "Booking gagal diproses. Coba lagi beberapa saat, atau hubungi kami via WhatsApp.",
    }
  }

  const params = new URLSearchParams({
    nomor: data.nomor_reservasi,
    no_req: data.nomor_permintaan,
    token: data.token_qr,
    total: String(data.total_harga ?? ""),
    mulai,
    selesai,
  })

  redirect(`/booking/sukses?${params.toString()}`)
}
