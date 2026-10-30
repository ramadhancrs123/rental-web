"use client"

import { useState } from "react"
import { ArrowUpRight, MapPinned, Mountain, Navigation, Route } from "lucide-react"
import MountainWeather from "@/components/mountain-weather"

const DESTINATIONS = [
  { id: "papandayan", name: "Gunung Papandayan", elevation: "2.622 mdpl", area: "Cisurupan, Garut", description: "Lanskap kawah, padang terbuka, dan suasana pegunungan untuk merencanakan perjalanan alam.", mapQuery: "Gunung Papandayan, Cisurupan, Garut, Jawa Barat" },
  { id: "cikuray", name: "Gunung Cikuray", elevation: "2.821 mdpl", area: "Dayeuhmanggung, Garut", description: "Salah satu puncak tertinggi di Garut, dikenal dengan panorama pegunungan dan lautan awan.", mapQuery: "Gunung Cikuray, Garut, Jawa Barat" },
  { id: "guntur", name: "Gunung Guntur", elevation: "2.249 mdpl", area: "Kawasan Garut", description: "Pilihan lanskap vulkanik yang ikonik di sekitar Garut. Rencanakan perlengkapan sesuai rute dan kondisi terbaru.", mapQuery: "Gunung Guntur, Garut, Jawa Barat" },
  { id: "karacak", name: "Gunung Karacak", elevation: "1.838 mdpl", area: "Karangpawitan, Garut", description: "Destinasi pegunungan dekat kawasan Garut untuk mengenal pilihan perjalanan alam di sekitar kota.", mapQuery: "Gunung Karacak, Garut, Jawa Barat" },
]

export default function MountainMap() {
  const [activeId, setActiveId] = useState(DESTINATIONS[0].id)
  const active = DESTINATIONS.find((destination) => destination.id === activeId) ?? DESTINATIONS[0]
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(active.mapQuery)
  const embedUrl = "https://maps.google.com/maps?q=" + encodeURIComponent(active.mapQuery) + "&output=embed"

  return (
    <section id="destinasi" className="scroll-mt-24 border-y border-border/60 bg-secondary/35 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <span className="section-eyebrow"><MapPinned className="size-3.5" /> Jelajahi Garut</span>
            <h2 className="mt-4 max-w-xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              Petualangan berikutnya, <span className="font-display font-normal text-primary italic">di mana?</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Kenali beberapa pegunungan di Garut, Jawa Barat. Pilih destinasi untuk melihat peta, lalu siapkan perlengkapan yang sesuai dengan rencana perjalananmu.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Route className="size-5" /></span>
            <div>
              <p className="text-sm font-semibold">Rencanakan dengan bijak</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Periksa cuaca, status jalur, aturan pendakian, dan arahan pengelola sebelum berangkat.</p>
            </div>
          </div>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {DESTINATIONS.map((destination, index) => {
              const selected = destination.id === activeId
              return (
                <button type="button" key={destination.id} aria-pressed={selected} onClick={() => setActiveId(destination.id)} className={"group flex h-full items-center gap-3 rounded-2xl border p-4 text-left transition duration-300 sm:gap-4 " + (selected ? "border-primary/45 bg-card shadow-md shadow-primary/5" : "border-border/60 bg-card/60 hover:border-primary/25 hover:bg-card")}>
                  <span className={"flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors " + (selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground group-hover:bg-primary/10 group-hover:text-primary")}><Mountain className="size-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{destination.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{destination.elevation} · {destination.area}</span>
                  </span>
                  <ArrowUpRight className={"size-4 shrink-0 transition-transform " + (selected ? "text-primary" : "text-muted-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5")} />
                  <span className="sr-only">{"Pilih peta " + destination.name + ", pilihan " + (index + 1)}</span>
                </button>
              )
            })}
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-lg shadow-slate-950/5">
            <div className="relative min-h-[270px] bg-muted sm:min-h-[350px]">
              <iframe key={active.id} title={"Peta " + active.name + ", Garut, Jawa Barat"} src={embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 size-full border-0 grayscale-[0.12] transition-opacity duration-500" allowFullScreen />
              <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/70 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur">
                <MapPinned className="size-3.5 text-orange-600" /> {active.name}
              </div>
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="max-w-lg">
                <p className="text-base font-semibold">{active.name}</p>
                <p className="mt-1 text-xs font-medium text-primary">{active.elevation} <span className="px-1 text-muted-foreground">·</span> {active.area}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{active.description}</p>
              </div>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:opacity-90">
                Buka peta <Navigation className="size-4" />
              </a>
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <MountainWeather destinationId={active.id} destinationName={active.name} />
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Informasi ketinggian dan wilayah disajikan sebagai ringkasan destinasi. Konfirmasi rute dan ketentuan terkini kepada pengelola setempat sebelum perjalanan.</p>
      </div>
    </section>
  )
}
