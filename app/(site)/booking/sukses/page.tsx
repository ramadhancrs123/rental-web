import BookingSuccessClient from "./booking-success-client"

export const metadata = {
  title: "Booking Berhasil | Akasha Outdoor",
  description: "Simpan bukti, kode akses, dan QR portal Akasha Smart Booking.",
}

export default function BookingSuksesPage() {
  return (
    <div className="min-h-[75vh] bg-background">
      <BookingSuccessClient />
    </div>
  )
}
