"use server"

import { getSupabase, USAHA_SLUG } from "@/lib/supabase"

export type PublicTestimonialFormState =
  | { status: "success"; message: string }
  | { status: "error"; message: string; field?: "nama_tampilan" | "rating" | "isi" | "general" }
  | null

export async function submitPublicTestimonial(
  _previous: PublicTestimonialFormState,
  formData: FormData,
): Promise<PublicTestimonialFormState> {
  if (String(formData.get("website") ?? "").trim()) {
    return { status: "success", message: "Terima kasih. Ceritamu sudah kami terima untuk ditinjau." }
  }

  const namaTampilan = String(formData.get("nama_tampilan") ?? "").trim()
  const konteks = String(formData.get("konteks") ?? "").trim()
  const isi = String(formData.get("isi") ?? "").trim()
  const rating = Number(formData.get("rating") ?? 5)

  if (namaTampilan.length < 2 || namaTampilan.length > 80) {
    return { status: "error", field: "nama_tampilan", message: "Nama tampilan harus terdiri dari 2–80 karakter." }
  }
  if (konteks.length > 120) {
    return { status: "error", field: "general", message: "Konteks perjalanan maksimal 120 karakter." }
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: "error", field: "rating", message: "Pilih rating dari 1 sampai 5." }
  }
  if (isi.length < 12 || isi.length > 1200) {
    return { status: "error", field: "isi", message: "Cerita harus terdiri dari 12–1.200 karakter." }
  }

  const sb = getSupabase()
  const { data: usaha, error: usahaError } = await sb
    .from("usaha")
    .select("usaha_id")
    .eq("slug", USAHA_SLUG)
    .eq("status", "active")
    .maybeSingle()

  if (usahaError || !usaha) {
    return { status: "error", field: "general", message: "Formulir sedang tidak tersedia. Silakan coba lagi nanti." }
  }

  const { error } = await sb.from("testimoni").insert({
    usaha_id: usaha.usaha_id,
    nama_tampilan: namaTampilan,
    konteks: konteks || null,
    rating,
    isi,
  })

  if (error) {
    return { status: "error", field: "general", message: "Cerita belum terkirim. Periksa koneksi lalu coba lagi." }
  }

  return {
    status: "success",
    message: "Terima kasih! Ceritamu sudah masuk antrean verifikasi admin dan belum ditampilkan ke publik.",
  }
}
