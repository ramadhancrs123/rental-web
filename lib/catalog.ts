import { getSupabase, USAHA_SLUG } from "@/lib/supabase"

export type CatalogVariant = {
  varian_barang_id: string
  barang_id: string
  barang_nama: string
  nama: string
  kategori_nama: string
  deskripsi: string | null
  price: number | null
  currency_code: string
}

export type CatalogItem = {
  barang_id: string
  nama: string
  slug: string
  kategori_nama: string
  deskripsi: string | null
  ringkasan_publik: string | null
  variants: CatalogVariant[]
  minPrice: number | null
}

export type Catalog = {
  usahaNama: string | null
  items: CatalogItem[]
}

// Tarif diurutkan server-side sebelum dipilih: prefer durasi 1 hari lalu nominal termurah
function pickBestPrice(rows: VPublicTarif[]) {
  if (rows.length === 0) return null
  const sorted = [...rows].sort((a, b) => {
    if (a.durasi_nilai !== b.durasi_nilai) return a.durasi_nilai - b.durasi_nilai
    return Number(a.nominal) - Number(b.nominal)
  })
  return sorted[0]
}

type VPublicTarif = {
  tarif_sewa_id: string
  barang_id: string | null
  varian_barang_id: string | null
  paket_sewa_id: string | null
  durasi_unit: string
  durasi_nilai: number
  nominal: string
  currency_code: string
}

export async function fetchCatalog(): Promise<Catalog> {
  const sb = getSupabase()

  const [barangRes, varianRes, tarifRes] = await Promise.all([
    sb.from("v_public_barang")
      .select("*")
      .eq("usaha_slug", USAHA_SLUG)
      .order("kategori_nama", { ascending: true })
      .order("nama", { ascending: true }),
    sb.from("v_public_varian_barang")
      .select("*")
      .eq("usaha_slug", USAHA_SLUG)
      .order("nama", { ascending: true }),
    sb.from("v_public_tarif_sewa")
      .select("*")
      .eq("usaha_slug", USAHA_SLUG)
      .not("varian_barang_id", "is", null),
  ])

  if (barangRes.error) throw barangRes.error
  if (varianRes.error) throw varianRes.error
  if (tarifRes.error) throw tarifRes.error

  const tarifs = (tarifRes.data ?? []) as VPublicTarif[]
  const tarifsByVarian = new Map<string, VPublicTarif[]>()
  for (const t of tarifs) {
    if (!t.varian_barang_id) continue
    const list = tarifsByVarian.get(t.varian_barang_id) ?? []
    list.push(t)
    tarifsByVarian.set(t.varian_barang_id, list)
  }

  const barangById = new Map(barangRes.data.map((b) => [b.barang_id, b]))
  const items: CatalogItem[] = []
  const grouped = new Map<string, CatalogItem>()

  for (const v of varianRes.data) {
    const b = barangById.get(v.barang_id)
    if (!b) continue
    const best = pickBestPrice(tarifsByVarian.get(v.varian_barang_id) ?? [])

    let item = grouped.get(b.barang_id)
    if (!item) {
      item = {
        barang_id: b.barang_id,
        nama: b.nama,
        slug: b.slug,
        kategori_nama: b.kategori_nama,
        deskripsi: b.deskripsi,
        ringkasan_publik: b.ringkasan_publik,
        variants: [],
        minPrice: null,
      }
      grouped.set(b.barang_id, item)
      items.push(item)
    }

    const variant: CatalogVariant = {
      varian_barang_id: v.varian_barang_id,
      barang_id: v.barang_id,
      barang_nama: b.nama,
      nama: v.nama,
      kategori_nama: b.kategori_nama,
      deskripsi: v.deskripsi,
      price: best ? Number(best.nominal) : null,
      currency_code: best?.currency_code ?? "IDR",
    }
    item.variants.push(variant)
    if (variant.price !== null) {
      item.minPrice =
        item.minPrice === null ? variant.price : Math.min(item.minPrice, variant.price)
    }
  }

  const usahaNama = barangRes.data[0]?.usaha_nama ?? null
  return { usahaNama, items }
}

/** Kategori unik (urut abjad) untuk filter/etap di UI */
export function catalogCategories(items: CatalogItem[]): string[] {
  return [...new Set(items.map((i) => i.kategori_nama))].sort()
}
