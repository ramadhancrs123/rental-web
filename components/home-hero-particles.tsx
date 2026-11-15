"use client"

import { useEffect, useRef } from "react"

type Particle = {
  x: number
  y: number
  radius: number
  phase: number
  speed: number
  drift: number
  alpha: number
}

function createParticles(width: number): Particle[] {
  const mobile = width < 640
  const count = mobile ? 9 : 15
  const startX = mobile ? 0.74 : 0.48

  return Array.from({ length: count }, (_, index) => {
    const seed = (index + 1) * 37.719
    const random = (value: number) => {
      const result = Math.sin(seed + value * 91.7) * 43758.5453
      return result - Math.floor(result)
    }

    return {
      x: startX + random(1) * (1 - startX),
      y: 0.08 + random(2) * 0.8,
      radius: 1.15 + random(3) * 1.2,
      phase: random(4) * Math.PI * 2,
      speed: 0.24 + random(5) * 0.24,
      drift: 2 + random(6) * 5,
      alpha: 0.5 + random(7) * 0.42,
    }
  })
}

export default function HomeHeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const section = canvas?.closest(".hero-scene")
    const context = canvas?.getContext("2d", { alpha: true, desynchronized: true })
    if (!canvas || !section || !context) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const particles = createParticles(section.clientWidth)
    let width = 0
    let height = 0
    let frame = 0
    let lastFrame = 0
    let visible = false
    let disposed = false

    const resize = () => {
      const bounds = section.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, width, height)
      if (reducedMotion.matches) draw(0)
    }

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height)
      for (const particle of particles) {
        const wave = Math.sin(time * 0.00035 * particle.speed + particle.phase)
        const x = particle.x * width + wave * particle.drift
        const y = particle.y * height + Math.cos(time * 0.00024 * particle.speed + particle.phase) * particle.drift * 0.75
        const opacity = particle.alpha * (0.7 + (wave + 1) * 0.15)

        context.save()
        context.shadowBlur = 9
        context.shadowColor = `rgba(255, 177, 105, ${(opacity * 0.88).toFixed(3)})`
        context.beginPath()
        context.arc(x, y, particle.radius, 0, Math.PI * 2)
        context.fillStyle = `rgba(255, 224, 190, ${opacity.toFixed(3)})`
        context.fill()
        context.restore()
      }
    }

    const animate = (time: number) => {
      frame = 0
      if (disposed || !visible || document.visibilityState !== "visible" || reducedMotion.matches) return
      if (time - lastFrame >= 1000 / 24) {
        draw(time)
        lastFrame = time
      }
      frame = window.requestAnimationFrame(animate)
    }

    const start = () => {
      if (disposed || !visible || document.visibilityState !== "visible") return
      if (reducedMotion.matches) {
        draw(0)
        return
      }
      if (!frame) frame = window.requestAnimationFrame(animate)
    }

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") start()
      else stop()
    }

    const handleMotionPreference = () => {
      stop()
      if (reducedMotion.matches) draw(0)
      else start()
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible) start()
        else stop()
      },
      { threshold: 0 },
    )
    const resizeObserver = new ResizeObserver(resize)
    observer.observe(section)
    resizeObserver.observe(section)
    document.addEventListener("visibilitychange", handleVisibility)
    reducedMotion.addEventListener("change", handleMotionPreference)
    resize()

    return () => {
      disposed = true
      stop()
      observer.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener("visibilitychange", handleVisibility)
      reducedMotion.removeEventListener("change", handleMotionPreference)
      context.clearRect(0, 0, width, height)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-particles absolute inset-0 size-full" aria-hidden="true" />
}
