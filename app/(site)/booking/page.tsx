import { redirect } from "next/navigation"

export const metadata = {
  title: "Booking | Akasha Outdoor",
  description: "Pilih perlengkapan dan kirim permintaan booking melalui katalog Akasha Outdoor.",
}

export default function BookingPage() {
  redirect("/katalog")
}
