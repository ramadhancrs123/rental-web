import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import BookingPortalClient from "./portal-client"
import { fetchCatalog } from "@/lib/catalog"

export const metadata = {
  title: "Portal Customer | Akasha Smart Booking",
  description: "Lihat status, rincian, ketersediaan, dan ajukan perubahan booking Akasha.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default async function BookingPortalPage() {
  const catalog = await fetchCatalog().catch(() => ({
    usahaNama: null,
    items: [],
    packages: [],
    sales: [],
  }))

  return (
    <div className="min-h-[70vh] bg-background px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/katalog" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke katalog
        </Link>
        <div className="mt-4"><BookingPortalClient catalog={catalog} /></div>
      </div>
    </div>
  )
}
