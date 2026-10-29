"use client"

import { useState } from "react"
import { ExternalLink, MapPinned } from "lucide-react"

type MapMode = "source" | "roadmap" | "satellite" | "terrain"

type GoogleMapsEmbedProps = {
  src: string | null | undefined
  title: string
  viewUrl?: string | null
  searchQuery?: string
  className?: string
  frameClassName?: string
  caption?: string
}

const mapModes: Array<{ id: MapMode; label: string }> = [
  { id: "source", label: "Peta jalur" },
  { id: "roadmap", label: "Peta jalan" },
  { id: "satellite", label: "Satelit" },
  { id: "terrain", label: "Medan" },
]

function cleanMyMapsEmbed(url: string) {
  // Avoid tying the public embed to an owner's logged-in Google account selector.
  return url.replace("https://www.google.com/maps/d/u/0/embed", "https://www.google.com/maps/d/embed")
    .replace("https://www.google.com/maps/d/u/1/embed", "https://www.google.com/maps/d/embed")
}

function googleBaseMap(query: string, mode: Exclude<MapMode, "source">) {
  const layer = mode === "satellite" ? "k" : mode === "terrain" ? "p" : "m"
  return "https://maps.google.com/maps?q=" + encodeURIComponent(query) + "&z=12&t=" + layer + "&output=embed&hl=id"
}

export default function GoogleMapsEmbed({ src, title, viewUrl, searchQuery = "Jawa Barat, Indonesia", className = "", frameClassName = "", caption }: GoogleMapsEmbedProps) {
  const [mode, setMode] = useState<MapMode>(src ? "source" : "roadmap")
  const activeMode = mode === "source" && !src ? "roadmap" : mode
  const activeSrc = activeMode === "source" && src
    ? cleanMyMapsEmbed(src)
    : googleBaseMap(searchQuery, activeMode === "source" ? "roadmap" : activeMode)

  return (
    <section className={"overflow-hidden rounded-3xl border border-border/60 bg-card " + className}>
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><MapPinned className="size-4.5" aria-hidden="true" /></span>
            <div className="min-w-0"><h2 className="truncate text-sm font-semibold">{title}</h2><p className="mt-0.5 text-[10px] text-muted-foreground">{activeMode === "source" ? "Google My Maps · sumber jalur" : "Google Maps · tampilan peta dasar"}</p></div>
          </div>
          {viewUrl && <a href={viewUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold transition hover:bg-muted"><span className="hidden sm:inline">Buka peta</span><ExternalLink className="size-3.5" /><span className="sr-only">Buka peta di tab baru</span></a>}
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Pilih tampilan peta">
          {mapModes.filter((item) => item.id !== "source" || Boolean(src)).map((item) => (
            <button key={item.id} type="button" aria-pressed={activeMode === item.id} onClick={() => setMode(item.id)} className={"min-h-8 rounded-full border px-3 py-1.5 text-[10px] font-semibold transition " + (activeMode === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground")}>{item.label}</button>
          ))}
        </div>
      </div>
      <div className={"relative bg-muted " + frameClassName}>
        <iframe
          key={activeMode + ":" + activeSrc}
          src={activeSrc}
          title={title + (activeMode === "source" ? " — peta jalur sumber" : " — " + mapModes.find((item) => item.id === activeMode)?.label)}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 size-full"
        />
      </div>
      {activeMode !== "source" && src && <p className="border-t border-border/60 px-4 py-2.5 text-[10px] leading-5 text-muted-foreground sm:px-5">Tampilan dasar ini dapat berganti antara peta jalan, satelit, dan medan. Untuk melihat jalur serta penanda dari data sumber, pilih “Peta jalur”.</p>}
      {caption && <p className="border-t border-border/60 px-4 py-3 text-[11px] leading-5 text-muted-foreground sm:px-5">{caption}</p>}
    </section>
  )
}
