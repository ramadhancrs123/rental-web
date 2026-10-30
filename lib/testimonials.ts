import { unstable_cache } from "next/cache"
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

async function loadPublicTestimonials(offset: number, limit: number): Promise<PublicTestimonialPage> {
  const { data, error, count } = await getSupabase()
    .from("v_public_testimoni")
    .select("testimoni_id,usaha_slug,nama_tampilan,konteks,rating,isi,published_at", { count: "exact" })
    .eq("usaha_slug", USAHA_SLUG)
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  if (!data) throw new Error("Data testimoni publik tidak tersedia.")

  return { items: data as PublicTestimonial[], count: count ?? data.length }
}

const getCachedPublicTestimonials = unstable_cache(
  loadPublicTestimonials,
  ["public-testimonials-v1", USAHA_SLUG],
  {
    revalidate: 60,
    tags: ["public-testimonials", "public-testimonials:" + USAHA_SLUG],
  },
)

export async function fetchPublicTestimonials(offset = 0, limit = 3): Promise<PublicTestimonialPage> {
  const safeOffset = Math.max(0, Math.floor(offset))
  const safeLimit = Math.min(48, Math.max(1, Math.floor(limit)))

  try {
    return await getCachedPublicTestimonials(safeOffset, safeLimit)
  } catch {
    return { items: [], count: 0 }
  }
}
