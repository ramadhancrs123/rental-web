import Link from "next/link"
import QRCode from "qrcode"
import {
  CalendarDays,
  CircleCheck,
  MessageCircle,
  ArrowLeft,
  QrCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah, WA_NUMBER } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Booking Diterima | Akasha Outdoor Rent",
}

function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${iso}T12:00:00+07:00`))
}

export default async function BookingSuksesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const nomor = String(sp.nomor ?? "")
  const token = String(sp.token ?? "")
  const total = Number(sp.total ?? "")
  const mulai = String(sp.mulai ?? "")
  const selesai = String(sp.selesai ?? "")

  if (!nomor || !token) {
    return (
      <div className="mx-auto max-w-xl px-4 py-32 text-center">
        <h1 className="text-2xl font-semibold">Data booking tidak ditemukan</h1>
        <p className="mt-2 text-muted-foreground">
          Halaman ini hanya untuk booking yang baru saja dikirim.
        </p>
        <Link href="/booking" className="mt-8 inline-block">
          <Button variant="outline" className="rounded-full px-8">
            <ArrowLeft className="mr-2 size-4" />
            Kembali ke Form Booking
          </Button>
        </Link>
      </div>
    )
  }

  const qrSvg = await QRCode.toString(token, {
    type: "svg",
    margin: 1,
    width: 220,
    color: { dark: "#1a2b20", light: "#ffffff" },
  })

  const waText = encodeURIComponent(
    `Halo Akasha Outdoor Rent! Saya baru mengirim booking online.\n\n` +
      `Reservasi: ${nomor}\n` +
      `Permintaan: ${String(sp.no_req ?? "-")}\n` +
      `Periode: ${mulai} s/d ${selesai}\n` +
      `Token QR: ${token}\n\n` +
      `Mohon informasi konfirmasi & harga akhirnya ya. Terima kasih!`
  )
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waText}`

  return (
    <div className="bg-background">
      <section className="relative pt-24 pb-16">
        <div className="pointer-events-none absolute -top-32 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative z-10 mx-auto max-w-xl space-y-6 px-4 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CircleCheck className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
              Booking <span className="font-display italic text-primary">diterima!</span>
            </h1>
            <p className="mt-3 text-muted-foreground">
              Simpan nomor & QR code di bawah ini. Admin akan menghubungi kamu
              via WhatsApp untuk konfirmasi.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-4 pb-24">
        <div className="rounded-3xl border border-border/60 bg-card p-8 text-center shadow-xs">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Nomor Reservasi
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-primary">
            {nomor}
          </p>

          <hr className="my-6 border-border/50" />

          <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                <CalendarDays className="size-3.5 text-primary" />
                Mulai
              </p>
              <p className="mt-1 text-sm font-medium">{formatDate(mulai)}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                <CalendarDays className="size-3.5 text-primary" />
                Selesai
              </p>
              <p className="mt-1 text-sm font-medium">{formatDate(selesai)}</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Perkiraan total</p>
              <p className="mt-1 text-sm font-medium">
                {total > 0 ? formatRupiah(total) : "Menunggu konfirmasi admin"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Harga akhir dikonfirmasi admin
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                <QrCode className="size-3.5 text-primary" />
                Status
              </p>
              <p className="mt-1 text-sm font-medium">
                Menunggu persetujuan admin
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              QR Reservasi
            </h2>
            <div
              className="mx-auto mt-4 w-fit rounded-2xl border border-border/60 bg-white p-4 shadow-sm [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Tunjukkan QR ini saat pengambilan barang di lokasi.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <a href={waLink} target="_blank" rel="noreferrer" className="block">
            <Button className="flex h-14 w-full items-center gap-3 rounded-full text-base font-medium">
              <MessageCircle className="size-5" />
              Tanya Admin via WhatsApp
            </Button>
          </a>
          <p className="text-center text-xs text-muted-foreground">
            Tombol di atas membuka WhatsApp dengan pesan yang sudah terisi
            otomatis — tinggal tekan kirim.
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="size-4" />
                Kembali ke Beranda
              </Button>
            </Link>
            <Link href="/katalog">
              <Button variant="outline" className="rounded-full px-6">
                Lihat Katalog Lain
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
