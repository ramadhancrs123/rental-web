"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import type { PublicTestimonial } from "@/lib/testimonials"
import TestimonialCard from "@/components/testimonial-card"

function TestimonialPreview({ items }: { items: PublicTestimonial[] }) {
  return (
    <div className="testimonial-carousel" role="region" aria-roledescription="carousel" aria-label="Ulasan pelanggan Akasha">
      <div className="testimonial-preview__viewport overflow-x-auto" aria-label="Geser untuk membaca cerita pelanggan">
        <div className="testimonial-carousel__track flex">
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
      <p className="mt-3 text-[10px] text-muted-foreground sm:hidden" aria-hidden="true">
        Geser untuk membaca cerita lainnya
      </p>
    </div>
  )
}

const InteractiveTestimonialCarousel = dynamic(
  () => import("@/components/testimonial-carousel"),
  {
    ssr: false,
    loading: () => null,
  },
)

export default function LazyTestimonialCarousel({ items }: { items: PublicTestimonial[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)

  useEffect(() => {
    const target = rootRef.current
    if (!target || isNearViewport) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          setIsNearViewport(true)
        }
      },
      { rootMargin: "320px 0px", threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [isNearViewport])

  return (
    <div ref={rootRef}>
      {isNearViewport ? (
        <InteractiveTestimonialCarousel items={items} />
      ) : (
        <TestimonialPreview items={items} />
      )}
    </div>
  )
}
