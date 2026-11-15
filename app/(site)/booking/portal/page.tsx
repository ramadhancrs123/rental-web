import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import PwaInstallButton from "@/components/pwa-install-button"
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
    <div className="portal-customer-theme min-h-dvh bg-background px-3 py-4 text-foreground sm:px-5 sm:py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="Akasha Outdoor" width={28} height={28} priority className="size-7 shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold tracking-[0.08em] text-foreground">AKASHA <span className="text-primary">SMART</span> BOOKING</p>
              <p className="text-[9px] font-medium tracking-[0.12em] text-muted-foreground">AKASHA OUTDOOR · CUSTOMER PORTAL</p>
            </div>
          </div>
          <span className="hidden shrink-0 text-[9px] font-semibold tracking-[0.12em] text-muted-foreground sm:inline">CUSTOMER AREA</span>
        </div>
        <Link href="/katalog" className="inline-flex h-9 items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Kembali ke katalog
        </Link>
        <div className="mt-3"><BookingPortalClient catalog={catalog} /></div>
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-border/60 py-4 sm:flex-row">
          <p className="text-center text-[10px] text-muted-foreground sm:text-left">Akses portal booking Akasha lebih praktis dari perangkat Anda.</p>
          <PwaInstallButton compact />
        </div>
      </div>
    </div>
  )
}
