"use client"

import { useState, useEffect, useCallback } from "react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Menu, X, ArrowUpRight, Tent } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import ThemeToggle from "@/components/theme-toggle"

const NAV_ITEMS = [
  { title: "Beranda", href: "/" },
  { title: "Katalog", href: "/katalog" },
  { title: "Keunggulan", href: "/#keunggulan" },
  { title: "Destinasi", href: "/#destinasi" },
  { title: "Cara Menyewa", href: "/#cara-pesan" },
  { title: "Kontak", href: "/#kontak" },
]

export default function SiteHeader() {
  const [sticky, setSticky] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const handleScroll = useCallback(() => setSticky(window.scrollY >= 24), [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(handleScroll)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", handleScroll) }
  }, [handleScroll])

  const isNavItemActive = (href: string) => {
    if (href.includes("#")) return false
    if (href === "/" && pathname !== "/") return false
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky inset-x-0 top-0 z-50 flex h-20 items-center justify-center px-3 sm:px-4">
      <div className={cn("mx-auto flex h-fit w-full max-w-7xl items-center justify-between gap-3.5 rounded-full border px-3 py-2 transition-all duration-500 lg:gap-5", sticky ? "border-border/60 bg-background/85 shadow-lg shadow-slate-950/5 backdrop-blur-xl" : "border-transparent bg-background/55 backdrop-blur-md")}>
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label="Akasha Outdoor Rent, beranda">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm sm:size-10"><Tent className="size-5" /></span>
          <span className="truncate text-[13px] font-bold tracking-tight sm:text-base">Akasha <span className="text-primary">Outdoor</span><span className="ml-1 font-display font-normal text-primary italic">Rent</span></span>
        </Link>

        <nav className="hidden xl:block" aria-label="Navigasi utama">
          <ul className="flex items-center gap-0.5 rounded-full border border-border/50 bg-muted/45 p-1">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item.href)
              return <li key={item.href}><Link href={item.href} className={cn("block rounded-full px-3.5 py-2 text-xs font-medium transition-colors 2xl:px-4 2xl:text-sm", active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item.title}</Link></li>
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden size-9 rounded-full border-border/60 bg-card/80 shadow-sm transition hover:rotate-6 lg:flex" />
          <Link href="/booking" className="hidden h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-90 sm:inline-flex sm:px-5 sm:text-sm">Pesan Sekarang <ArrowUpRight className="size-4" /></Link>
          <div className="flex items-center gap-2 xl:hidden">
            <div className="sm:hidden"><ThemeToggle className="size-9 rounded-full border-border/60 bg-card/80" /></div>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger" aria-label="Buka menu navigasi" className="rounded-full border border-border/70 bg-card/80 p-2.5 backdrop-blur-md"><Menu className="size-4.5" /></SheetTrigger>
              <SheetContent showCloseButton={false} side="right" className="w-[min(90vw,390px)] border-l border-border/60 p-0">
                <div className="flex items-center justify-between border-b border-border/60 p-5">
                  <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Tent className="size-4" /></span><span className="text-sm font-semibold">Akasha Outdoor Rent</span></Link>
                  <SheetClose id="mobile-menu-close" aria-label="Tutup menu" className="rounded-full border border-border p-2.5"><X className="size-4" /></SheetClose>
                  <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
                </div>
                <div className="flex h-[calc(100%-73px)] flex-col gap-7 overflow-y-auto px-5 py-6">
                  <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
                    {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className={cn("group flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-semibold transition-colors", isNavItemActive(item.href) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted")}>{item.title}<ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>)}
                  </nav>
                  <div className="mt-auto space-y-4 border-t border-border/60 pt-5">
                    <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Suasana tampilan</span><ThemeToggle className="size-10 rounded-full border-border/60 bg-background" /></div>
                    <Link href="/booking" onClick={() => setIsOpen(false)} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90">Pesan Sekarang <ArrowUpRight className="size-4" /></Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
