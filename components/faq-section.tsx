"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "Bagaimana cara memesan perlengkapan?",
    a: "Isi form booking di halaman Booking: pilih tanggal sewa, atur jumlah perlengkapan, lalu kirim. Reservasi langsung masuk sistem kami dengan nomor reservasi dan QR code.",
  },
  {
    q: "Apakah harga yang tampil adalah harga akhir?",
    a: "Harga di katalog adalah harga sewa per hari sebagai estimasi. Harga akhir dikonfirmasi admin saat reservasi disetujui — termasuk kebijakan deposit atau denda keterlambatan.",
  },
  {
    q: "Bagaimana aturan toleransi pengembalian?",
    a: "Akasha memberikan toleransi hingga 10 jam sejak jadwal pengembalian. Setelah periode toleransi berakhir, ketentuan denda keterlambatan berlaku sesuai aturan rental yang dikonfirmasi admin.",
  },
  {
    q: "Berapa lama proses konfirmasi booking?",
    a: "Admin memeriksa ketersediaan stok dan mengabari kamu lewat WhatsApp, biasanya dalam hitungan jam pada jam operasional. Kamu juga bisa langsung tanya admin lewat tombol WhatsApp setelah booking dikirim.",
  },
  {
    q: "Untuk apa QR code reservasi?",
    a: "Setelah booking dikirim kamu mendapat QR code. Tunjukkan QR ini kepada admin saat pengambilan barang — proses serah terima jadi cepat tanpa perlu hafal nomor reservasi.",
  },
  {
    q: "Bisa membatalkan atau mengubah pesanan?",
    a: "Bisa. Hubungi admin via WhatsApp dengan menyebut nomor reservasi. Selama barang belum diambil, reservasi dapat dibatalkan atau disesuaikan ketersediaannya.",
  },
  {
    q: "Bagaimana kondisi dan kebersihan perlengkapan?",
    a: "Setiap unit diperiksa ketat sebelum dan sesudah disewa. Perlengkapan yang diambil dan dikembalikan melewati pemeriksaan kondisi agar kamu selalu mendapat unit yang siap pakai.",
  },
  {
    q: "Apakah bisa sewa untuk grup atau kegiatan komunitas?",
    a: "Tentu. Untuk kebutuhan jumlah besar atau durasi panjang, chat admin via WhatsApp agar kami bisa siapkan paket dan penawaran yang paling pas.",
  },
]

export default function FaqSection() {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card p-6 shadow-xs sm:p-10">
      <Accordion className="gap-0">
        {FAQS.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-border/50 px-1">
            <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
