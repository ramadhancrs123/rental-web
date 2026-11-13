"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const FAQS = [
  {
    q: "Bagaimana cara menyewa perlengkapan di Akasha?",
    a: "Buka Akasha Smart Booking, pilih perlengkapan atau paket yang Anda butuhkan, lalu atur jumlah dan tanggal pengambilan serta pengembalian. Setelah data dilengkapi, kirim pengajuan. Tim Akasha akan membantu memastikan ketersediaan dan detail penyewaan.",
  },
  {
    q: "Bisakah saya menyewa beberapa barang sekaligus?",
    a: "Bisa. Anda dapat menggabungkan beberapa jenis perlengkapan dan paket dalam satu pengajuan, lalu meninjau kembali pilihan serta jumlahnya sebelum dikirim.",
  },
  {
    q: "Kapan booking saya dinyatakan terkonfirmasi?",
    a: "Pengajuan belum otomatis menjadi booking terkonfirmasi. Tim Akasha akan memeriksa ketersediaan barang, jadwal, dan rincian sewa terlebih dahulu. Konfirmasi selanjutnya dapat Anda pantau melalui portal pribadi dan komunikasi dengan Tim Akasha.",
  },
  {
    q: "Bagaimana cara melihat status booking?",
    a: "Setelah pengajuan dikirim, simpan tautan pribadi atau kode akses yang tercantum pada bukti booking. Anda juga dapat memindai QR untuk membuka portal pribadi dan melihat perkembangan penyewaan.",
  },
  {
    q: "Bagaimana jika ingin mengubah atau membatalkan booking?",
    a: "Ajukan permintaan perubahan barang, jumlah, jadwal, atau pembatalan melalui portal booking Anda. Tim Akasha akan meninjau permintaan tersebut dan menginformasikan hasilnya. Perubahan atau pembatalan berlaku setelah dikonfirmasi.",
  },
  {
    q: "Bagaimana ketentuan waktu pengembalian?",
    a: "Akasha memberikan toleransi pengembalian hingga 10 jam setelah jadwal yang disepakati. Ketentuan keterlambatan setelah masa toleransi mengikuti aturan sewa yang berlaku dan dapat dikonfirmasi kepada Tim Akasha.",
  },
  {
    q: "Bagaimana kondisi perlengkapan sebelum diserahkan?",
    a: "Kondisi perlengkapan diperiksa sebelum serah terima. Bila ada hal yang ingin Anda pastikan mengenai barang pilihan, silakan sampaikan kepada Tim Akasha sebelum penyewaan dikonfirmasi.",
  },
  {
    q: "Apakah Akasha melayani kebutuhan rombongan atau komunitas?",
    a: "Untuk kebutuhan beberapa orang, komunitas, atau jumlah perlengkapan yang lebih banyak, hubungi Tim Akasha. Kami akan membantu membahas pilihan barang, ketersediaan, dan kebutuhan perjalanan Anda.",
  },
]

export default function FaqSection() {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card p-5 shadow-xs sm:p-8 lg:p-9">
      <Accordion className="gap-0">
        {FAQS.map((item, i) => (
          <AccordionItem key={i} value={"faq-" + i} className="border-border/50 px-1">
            <AccordionTrigger className="py-5 text-left text-sm font-semibold hover:no-underline sm:text-base">
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
