import BookingCatalogExperience, {
  type CatalogFilter,
} from "@/components/booking/catalog-experience"
import { fetchCatalog } from "@/lib/catalog"

export const metadata = {
  title: "Akasha Smart Booking | Akasha Outdoor",
  description: "Pilih perlengkapan rental dan pembelian di katalog publik Akasha Outdoor.",
}

type KatalogPageProps = {
  searchParams: Promise<{ filter?: string | string[] }>
}

function resolveCatalogFilter(value: string | string[] | undefined): CatalogFilter {
  const filter = Array.isArray(value) ? value[0] : value
  return filter === "rental" || filter === "sale" || filter === "package"
    ? filter
    : "all"
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const [params, { catalog, catalogLoadFailed }] = await Promise.all([
    searchParams,
    fetchCatalog()
      .then((catalog) => ({ catalog, catalogLoadFailed: false }))
      .catch(() => ({
        catalog: { usahaNama: null, items: [], packages: [], sales: [] },
        catalogLoadFailed: true,
      })),
  ])

  return (
    <BookingCatalogExperience
      catalog={catalog}
      catalogLoadFailed={catalogLoadFailed}
      initialFilter={resolveCatalogFilter(params.filter)}
    />
  )
}
