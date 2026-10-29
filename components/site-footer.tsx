import Link from "next/link"
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, Tent } from "lucide-react"

const BUSINESS_PHONE = "0878-6495-9365"
const BUSINESS_PHONE_INTL = "+6287864959365"
const BUSINESS_WHATSAPP = "6287864959365"
const BUSINESS_EMAIL = "akasha.outdoor26@gmail.com"
const BUSINESS_ADDRESS = "Kp. Bentar Girang, Kel. Kota Wetan, Kec. Garut Kota, Kab. Garut, Jawa Barat"
const MAP_URL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(BUSINESS_ADDRESS)

export default function SiteFooter() {
  const waLink = "https://wa.me/" + BUSINESS_WHATSAPP + "?text=" + encodeURIComponent("Halo Akasha Outdoor Rent, saya ingin bertanya tentang penyewaan perlengkapan outdoor.")

  return (
    <footer id="kontak" className="scroll-mt-24 border-t border-border/60 bg-card px-4 pb-8 pt-14 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_1.15fr] md:gap-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Tent className="size-5" /></span>
            <span className="text-lg font-semibold tracking-tight">Akasha <span className="text-primary">Outdoor</span> <span className="font-display font-normal text-primary italic">Rent</span></span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground"><span className="font-display text-base text-foreground/85 italic">Ready for your wild journey.</span>{" "}Rental perlengkapan outdoor untuk menemani rencana petualanganmu di Garut dan sekitarnya.</p>
          <nav className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <Link href="/" className="transition hover:text-foreground">Beranda</Link>
            <Link href="/katalog" className="transition hover:text-foreground">Katalog</Link>
            <Link href="/booking" className="transition hover:text-foreground">Booking</Link>
            <Link href="/#destinasi" className="transition hover:text-foreground">Destinasi</Link>
          </nav>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Hubungi Akasha</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background p-4 transition hover:border-primary/35">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="min-w-0"><span className="block text-xs font-semibold">Lokasi usaha</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{BUSINESS_ADDRESS}</span><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">Lihat peta <ArrowUpRight className="size-3" /></span></span>
            </a>
            <div className="grid gap-3">
              <a href={"tel:" + BUSINESS_PHONE_INTL} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 transition hover:border-primary/35"><Phone className="size-4 shrink-0 text-primary" /><span><span className="block text-xs font-semibold">Telepon</span><span className="mt-1 block text-sm text-muted-foreground">{BUSINESS_PHONE}</span></span></a>
              <a href={"mailto:" + BUSINESS_EMAIL} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 transition hover:border-primary/35"><Mail className="size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-xs font-semibold">Email</span><span className="mt-1 block break-all text-sm text-muted-foreground">{BUSINESS_EMAIL}</span></span></a>
            </div>
          </div>
          <a href={waLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-[#167e57] px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#126c4a]"><MessageCircle className="size-4" /> Chat WhatsApp <ArrowUpRight className="size-4" /></a>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-border/60 pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Akasha Outdoor Rent. Semua hak dilindungi.</p><p>Dirancang untuk petualangan yang lebih siap.</p>
      </div>
    </footer>
  )
}
