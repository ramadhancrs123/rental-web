"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Download, MoreVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"

type InstallChoice = {
  outcome: "accepted" | "dismissed"
  platform: string
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<InstallChoice>
}

type PwaInstallButtonProps = {
  className?: string
  compact?: boolean
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

let appInstalledInSession = false

function getInstalledSnapshot() {
  return appInstalledInSession || isStandaloneApp()
}

function subscribeInstalled(callback: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)")
  const onAppInstalled = () => {
    appInstalledInSession = true
    callback()
  }
  displayMode.addEventListener("change", callback)
  window.addEventListener("appinstalled", onAppInstalled)
  window.addEventListener("akasha-pwa-installed", onAppInstalled)
  return () => {
    displayMode.removeEventListener("change", callback)
    window.removeEventListener("appinstalled", onAppInstalled)
    window.removeEventListener("akasha-pwa-installed", onAppInstalled)
  }
}

export default function PwaInstallButton({
  className,
  compact = false,
}: PwaInstallButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const installed = useSyncExternalStore(subscribeInstalled, getInstalledSnapshot, () => false)
  const [showHelp, setShowHelp] = useState(false)
  const [helpText, setHelpText] = useState("")
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setShowHelp(false)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (!showHelp) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowHelp(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setShowHelp(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("pointerdown", onPointerDown)
    }
  }, [showHelp])

  if (installed) return null

  function getInstallInstructions() {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent)
      || (platform === "MacIntel" && navigator.maxTouchPoints > 1)
    const isMacSafari = /Macintosh/i.test(userAgent)
      && /Safari/i.test(userAgent)
      && !/Chrome|Chromium|Edg|OPR|Brave/i.test(userAgent)
    const isFirefox = /Firefox|FxiOS/i.test(userAgent)
    const isAndroid = /Android/i.test(userAgent)
    const isMobile = isAndroid || isAppleMobile
      || window.matchMedia("(pointer: coarse)").matches
    const supportsChromiumInstall = /Chrome|Chromium|CriOS|Edg|OPR|SamsungBrowser|Brave/i.test(userAgent)

    if (isAppleMobile) {
      return "Buka menu Bagikan pada browser, pilih Tambahkan ke Layar Utama, lalu ketuk Tambahkan."
    }
    if (isMacSafari) {
      return "Di Safari, pilih File → Add to Dock (Tambahkan ke Dock)."
    }
    if (isFirefox && isAndroid) {
      return "Buka menu ⋮ Firefox, lalu pilih Tambahkan ke layar utama. Untuk pemasangan aplikasi PWA mandiri, gunakan Chrome atau Samsung Internet."
    }
    if (supportsChromiumInstall && isMobile) {
      return "Buka menu ⋮ browser, lalu pilih Instal aplikasi atau Tambahkan ke layar utama."
    }
    if (supportsChromiumInstall) {
      return "Gunakan ikon instal di address bar, atau buka menu ⋮ lalu pilih Install page as app."
    }
    if (isFirefox && !isMobile) {
      return "Browser ini belum menyediakan instalasi PWA desktop. Buka Akasha menggunakan Chrome atau Edge, lalu pilih ikon instal di address bar."
    }
    return "Buka menu browser dan pilih Tambahkan ke Layar Utama atau Instal Aplikasi. Pada desktop, gunakan Chrome atau Edge untuk pengalaman aplikasi mandiri."
  }

  async function install() {
    if (!deferredPrompt) {
      setHelpText(getInstallInstructions())
      setShowHelp((current) => !current)
      return
    }

    const promptEvent = deferredPrompt
    setInstalling(true)
    setDeferredPrompt(null)
    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === "accepted") {
        appInstalledInSession = true
        window.dispatchEvent(new Event("akasha-pwa-installed"))
      }
    } catch {
      setHelpText(getInstallInstructions())
      setShowHelp(true)
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => void install()}
        disabled={installing}
        aria-label="Instal Akasha Smart Booking"
        aria-haspopup="dialog"
        aria-expanded={showHelp}
        aria-controls="akasha-pwa-install-help"
        title="Instal Akasha Smart Booking"
        className={cn(
          "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.07] px-3 text-[11px] font-semibold text-primary transition hover:border-primary/45 hover:bg-primary/10 disabled:opacity-50",
          compact && "h-8 px-2.5 text-[10px]",
          className,
        )}
      >
        <Download className="size-3.5 shrink-0" />
        <span className="inline">
          {installing ? "Menyiapkan…" : compact ? "Pasang" : "Pasang Aplikasi"}
        </span>
      </button>

      {showHelp ? (
        <div
          id="akasha-pwa-install-help"
          role="dialog"
          aria-modal="false"
          aria-labelledby="akasha-pwa-install-title"
          className="absolute right-0 top-full z-[90] mt-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl border border-border/80 bg-card p-4 text-left shadow-xl shadow-slate-950/15"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <MoreVertical className="size-4 text-primary" />
              <h2 id="akasha-pwa-install-title" className="text-xs font-semibold">Pasang Akasha Smart Booking</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label="Tutup petunjuk instalasi"
              className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{helpText}</p>
          <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
            Setelah dipasang, aplikasi dapat dibuka dari layar utama atau menu aplikasi dalam tampilan mandiri.
          </p>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-full bg-primary px-3 text-[10px] font-semibold text-primary-foreground"
          >
            Mengerti
          </button>
        </div>
      ) : null}
    </div>
  )
}
