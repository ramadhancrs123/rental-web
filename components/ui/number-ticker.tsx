"use client"

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
} from "react"
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
  locale?: string
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  locale = "id-ID",
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const targetValue = direction === "down" ? startValue : value
  const motionValue = useMotionValue(
    prefersReducedMotion ? value : direction === "down" ? value : startValue
  )
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })

  useEffect(() => {
    if (prefersReducedMotion) {
      motionValue.set(value)
      return
    }

    if (!isInView) return

    const timer = setTimeout(() => {
      motionValue.set(targetValue)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay, isInView, motionValue, prefersReducedMotion, targetValue, value])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)))
        }
      }),
    [decimalPlaces, locale, springValue]
  )

  // Keep the real policy value visible in server-rendered HTML; the spring
  // animation can still count from zero when the number enters the viewport.
  const formattedInitial = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)

  return (
    <span
      ref={ref}
      aria-label={new Intl.NumberFormat(locale, {
        maximumFractionDigits: decimalPlaces,
      }).format(value)}
      className={cn(
        "inline-block tabular-nums tracking-tight",
        className
      )}
      {...props}
    >
      {formattedInitial}
    </span>
  )
}
