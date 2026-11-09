import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import BookingPortalClient from "./portal-client"
import { fetchCatalog } from "@/lib/catalog"

export const metadata = {
  title: "Portal Booking | Akasha Outdoor Rent",
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
    <main className="min-h-[70vh] bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/booking" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Kembali ke booking
        </Link>
        <div className="mt-6"><BookingPortalClient catalog={catalog} /></div>
      </div>
    </main>
  )
}
