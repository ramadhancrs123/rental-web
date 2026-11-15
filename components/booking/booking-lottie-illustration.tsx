"use client"

import { useEffect, useRef } from "react"
import type { AnimationItem } from "lottie-web"

function BookingSceneFallback() {
  return (
    <svg viewBox="0 0 260 150" className="booking-scene-fallback size-full" fill="none" aria-hidden="true">
      <path d="M10 126 70 59l32 35 37-54 72 86" stroke="currentColor" strokeOpacity=".22" strokeWidth="2" strokeLinejoin="round" />
      <path d="m93 126 42-67 49 67H93Z" fill="#bd7040" fillOpacity=".16" stroke="#e4a36e" strokeWidth="2.5" />
      <path d="m135 59 1 67m0-67 22 67" stroke="#f5d7b3" strokeOpacity=".86" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 128h224" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="204" cy="50" r="3" fill="#f4c28d" />
      <circle cx="222" cy="70" r="2" fill="#f4c28d" fillOpacity=".7" />
      <path d="m191 82 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z" fill="#f4c28d" fillOpacity=".8" />
    </svg>
  )
}

export default function BookingLottieIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animationRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

    let disposed = false
    let isVisible = false
    let loading = false
    let controller: AbortController | null = null

    const syncPlayback = () => {
      const animation = animationRef.current
      if (!animation) return
      if (isVisible && document.visibilityState === "visible" && !reducedMotion.matches) {
        animation.play()
      } else {
        animation.pause()
      }
    }

    const loadAnimation = async () => {
      if (loading || animationRef.current || disposed || reducedMotion.matches) return
      loading = true
      controller = new AbortController()

      try {
        const [lottieModule, response] = await Promise.all([
          import("lottie-web/build/player/lottie_light.min.js"),
          fetch("/animations/akasha-smart-booking.json", {
            signal: controller.signal,
            cache: "force-cache",
          }),
        ])
        if (!response.ok) throw new Error("Lottie asset unavailable")
        const animationData = await response.json()
        if (disposed || controller.signal.aborted) return

        const animation = lottieModule.default.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: false,
          animationData,
          rendererSettings: {
            progressiveLoad: true,
            hideOnTransparent: true,
            preserveAspectRatio: "xMidYMid meet",
          },
        })
        animation.setSubframe(false)
        animationRef.current = animation
        animation.addEventListener("DOMLoaded", () => {
          container.closest<HTMLElement>(".booking-lottie-scene")?.setAttribute("data-ready", "true")
          syncPlayback()
        })
      } catch {
        // The small inline SVG remains visible as a resilient fallback.
      } finally {
        loading = false
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible) void loadAnimation()
        syncPlayback()
      },
      { rootMargin: "160px 0px", threshold: 0 },
    )

    const handleVisibility = () => syncPlayback()
    const handleMotionPreference = () => {
      if (reducedMotion.matches) animationRef.current?.pause()
      else if (isVisible) void loadAnimation()
      syncPlayback()
    }

    observer.observe(container)
    document.addEventListener("visibilitychange", handleVisibility)
    reducedMotion.addEventListener("change", handleMotionPreference)

    return () => {
      disposed = true
      observer.disconnect()
      controller?.abort()
      document.removeEventListener("visibilitychange", handleVisibility)
      reducedMotion.removeEventListener("change", handleMotionPreference)
      animationRef.current?.destroy()
      animationRef.current = null
      container.closest<HTMLElement>(".booking-lottie-scene")?.removeAttribute("data-ready")
    }
  }, [])

  return (
    <div
      className="booking-lottie-scene relative shrink-0"
      aria-hidden="true"
    >
      <div className="booking-lottie-scene__fallback absolute inset-0">
        <BookingSceneFallback />
      </div>
      <div ref={containerRef} className="booking-lottie-scene__player absolute inset-0" />
    </div>
  )
}
