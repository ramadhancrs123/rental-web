import { getSupabase, USAHA_SLUG } from "@/lib/supabase"

export type PublicTestimonial = {
  testimoni_id: string
  usaha_slug: string
  nama_tampilan: string
  konteks: string | null
  rating: number
  isi: string
  published_at: string
}

export type PublicTestimonialPage = { items: PublicTestimonial[]; count: number }

export async function fetchPublicTestimonials(offset = 0, limit = 3): Promise<PublicTestimonialPage> {
  try {
    const safeOffset = Math.max(0, Math.floor(offset))
    const safeLimit = Math.min(48, Math.max(1, Math.floor(limit)))
    const { data, error, count } = await getSupabase()
      .from("v_public_testimoni")
      .select("testimoni_id,usaha_slug,nama_tampilan,konteks,rating,isi,published_at", { count: "exact" })
      .eq("usaha_slug", USAHA_SLUG)
      .order("published_at", { ascending: false })
      .range(safeOffset, safeOffset + safeLimit - 1)

    if (error || !data) return { items: [], count: 0 }
    return { items: data as PublicTestimonial[], count: count ?? data.length }
  } catch {
    return { items: [], count: 0 }
  }
}
