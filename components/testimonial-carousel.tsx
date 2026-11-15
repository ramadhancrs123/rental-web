"use client"

import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { PublicTestimonial } from "@/lib/testimonials"
import TestimonialCard from "@/components/testimonial-card"


export default function TestimonialCarousel({ items }: { items: PublicTestimonial[] }) {
  const [viewportRef, api] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    duration: 24,
    breakpoints: {
      "(prefers-reduced-motion: reduce)": { duration: 0 },
    },
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(items.length > 1)
  const [snapCount, setSnapCount] = useState(items.length)

  const syncControls = useCallback(() => {
    if (!api) return
    setSelectedIndex(api.selectedScrollSnap())
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
    setSnapCount(api.scrollSnapList().length)
  }, [api])

  useEffect(() => {
    if (!api) return
    const frame = window.requestAnimationFrame(syncControls)
    api.on("select", syncControls)
    api.on("reInit", syncControls)
    return () => {
      window.cancelAnimationFrame(frame)
      api.off("select", syncControls)
      api.off("reInit", syncControls)
    }
  }, [api, syncControls])

  if (items.length === 0) return null

  return (
    <div className="testimonial-carousel" role="region" aria-roledescription="carousel" aria-label="Ulasan pelanggan Akasha">
      <div
        className="testimonial-carousel__viewport overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        ref={viewportRef}
        tabIndex={0}
        aria-label="Geser atau gunakan tombol panah untuk membaca cerita pelanggan"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") { event.preventDefault(); api?.scrollPrev() }
          if (event.key === "ArrowRight") { event.preventDefault(); api?.scrollNext() }
        }}
      >
        <div className="testimonial-carousel__track flex touch-pan-y">
          {items.map((item, index) => (
            <div
              key={item.testimoni_id}
              className="testimonial-carousel__slide min-w-0 shrink-0 grow-0 basis-[88%] pl-3 sm:basis-[56%] sm:pl-4 xl:basis-[42%]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${items.length}`}
            >
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-[11px] font-medium tabular-nums text-muted-foreground" aria-live="polite">
            {String(selectedIndex + 1).padStart(2, "0")} <span className="mx-1 text-muted-foreground/50">/</span> {String(snapCount).padStart(2, "0")}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Cerita sebelumnya"
              onClick={() => api?.scrollPrev()}
              disabled={!canScrollPrev}
              className="grid size-9 place-items-center rounded-full border border-border/70 bg-card text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Cerita berikutnya"
              onClick={() => api?.scrollNext()}
              disabled={!canScrollNext}
              className="grid size-9 place-items-center rounded-full border border-border/70 bg-card text-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
