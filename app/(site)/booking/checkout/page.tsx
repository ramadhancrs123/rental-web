import { redirect } from "next/navigation"

export const metadata = {
  title: "Konfirmasi Booking | Akasha Outdoor",
  description: "Konfirmasi pilihan barang langsung dari katalog Akasha Outdoor.",
}

export default function BookingCheckoutPage() {
  redirect("/katalog")
}
