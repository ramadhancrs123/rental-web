import BookingCatalogExperience from "@/components/booking/catalog-experience"
import { fetchCatalog } from "@/lib/catalog"

export const metadata = {
  title: "Akasha Smart Booking | Akasha Outdoor",
  description: "Pilih perlengkapan rental dan pembelian di katalog publik Akasha Outdoor.",
}

export default async function KatalogPage() {
  const { catalog, catalogLoadFailed } = await fetchCatalog()
    .then((catalog) => ({ catalog, catalogLoadFailed: false }))
    .catch(() => ({
      catalog: { usahaNama: null, items: [], packages: [], sales: [] },
      catalogLoadFailed: true,
    }))

  return <BookingCatalogExperience catalog={catalog} catalogLoadFailed={catalogLoadFailed} />
}
