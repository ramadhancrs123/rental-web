import { ArrowUpRight, ChevronDown, MapPin, MessageCircle, Tent } from "lucide-react"

const BUSINESS_ADDRESS = "Kp. Bentar Girang, Kel. Kota Wetan, Kec. Garut Kota, Kab. Garut, Jawa Barat"
const MAP_URL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(BUSINESS_ADDRESS)
const WHATSAPP_URL = "https://wa.me/6287864959365?text=" + encodeURIComponent("Halo Akasha Outdoor Rent, saya ingin bertanya tentang perlengkapan outdoor.")

export default function AboutUs() {
  return (
    <section id="tentang-kami" className="scroll-mt-24 border-y border-border/60 bg-secondary/30 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <span className="section-eyebrow"><Tent className="size-3.5" /> Tentang Akasha</span>
          <h2 className="mt-4 text-3xl leading-[1.12] font-semibold tracking-tight sm:text-4xl">Berangkat lebih siap, <span className="font-display font-normal italic text-primary">menikmati lebih banyak.</span></h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">Akasha Outdoor Rent membantu menyiapkan perlengkapan untuk rencana camping dan perjalanan alam, dengan informasi yang jelas dan komunikasi langsung bersama pengelola.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-semibold transition hover:border-primary/35 hover:text-primary"><MapPin className="size-3.5" /> Lokasi usaha</a>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90"><MessageCircle className="size-3.5" /> Tanya pengelola <ArrowUpRight className="size-3.5" /></a>
          </div>
        </div>
        <details className="group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
            <span><span className="block text-sm font-semibold">Kenali Akasha lebih dekat</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Cerita singkat, layanan, dan lokasi kami.</span></span>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-border transition duration-300 group-open:rotate-180 group-open:bg-primary/10 group-open:text-primary"><ChevronDown className="size-4" /></span>
          </summary>
          <div className="space-y-4 border-t border-border/60 px-5 py-5 text-sm leading-6 text-muted-foreground sm:px-6">
            <p>Akasha Outdoor Rent berangkat dari gagasan sederhana: persiapan yang baik membuat waktu di alam terasa lebih nyaman. Kami menyediakan layanan penyewaan perlengkapan outdoor untuk membantu pendaki, teman-teman yang ingin camping, keluarga, dan siapa pun yang sedang menyusun perjalanan.</p>
            <p>Pilihan perlengkapan serta tarif yang tampil di katalog mengikuti data aktif yang dipublikasikan pengelola. Calon penyewa dapat melihat pilihan yang tersedia dan menyesuaikannya dengan kebutuhan perjalanan, tanpa harus menebak harga dari daftar yang sudah tidak berlaku.</p>
            <p>Kami mengutamakan komunikasi yang jelas. Sebelum penyewaan disepakati, pengelola membantu memastikan ketersediaan barang, tanggal, tarif, serta aturan pengambilan dan pengembalian. Pemesanan melalui website masih dalam pengembangan, sehingga booking untuk sementara dilakukan melalui kontak pengelola.</p>
            <p>Akasha Outdoor Rent berlokasi di {BUSINESS_ADDRESS}. Untuk menanyakan pilihan perlengkapan atau merencanakan penyewaan, silakan hubungi kami melalui WhatsApp. Kami akan membantu memberikan informasi yang diperlukan sebelum perjalanan dimulai.</p>
          </div>
        </details>
      </div>
    </section>
  )
}
