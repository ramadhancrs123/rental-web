"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"
import {
  ArrowRight, CalendarDays, Check, ChevronRight, CircleAlert, Minus, Package,
  PackageCheck, Plus, Search, ShoppingBag, ShoppingCart, SlidersHorizontal,
  Tent, Trash2, X, LoaderCircle, ShieldCheck,
} from "lucide-react"
import type { Catalog, CatalogItem, CatalogPackage, CatalogRentalOption, CatalogSaleOption } from "@/lib/catalog"
import { formatRupiah } from "@/lib/supabase"
import { createPortalAccessUrl } from "@/lib/akasha-smart-booking/portal-link"
import { createClientId } from "@/lib/client-id"
import {
  getPendingBookingIdempotencyKey,
  shouldRetainPendingBookingKey,
} from "@/lib/akasha-smart-booking/idempotency"
import {
  calculateRentalEstimate,
  calculateTariffPeriodsForDates,
  formatRentalStayLabel,
  formatTariffStayLabel,
} from "@/lib/rental-estimate"

const CART_KEY = "akasha-smart-booking-cart-v1"
const PENDING_KEY = "akasha-smart-booking-pending-v1"
const SUCCESS_KEY = "akasha-smart-booking-success-v1"
const MAX_LINES = 10
const MAX_QUANTITY = 20

type BookingCartLine = {
  id: string
  kind: "rental" | "sale"
  name: string
  category: string
  variant: string | null
  quantity: number
  price: number
  normalPrice: number
  discountPercent: number
  currencyCode: string
  durationValue: number | null
  durationUnit: string | null
  imageUrl: string | null
  reference: { barang_id: string | null; varian_barang_id: string | null; paket_sewa_id: string | null }
}

type ProductGroup = {
  id: string
  name: string
  category: string
  description: string | null
  imageUrl: string | null
  rental: CatalogRentalOption[]
  sale: CatalogSaleOption[]
}

type Selection =
  | { kind: "product"; group: ProductGroup }
  | { kind: "package"; item: CatalogPackage }

type SubmitResult = {
  reference_code: string
  access_code: string | null
  portal_link_token?: string | null
  credential_requires_rotation?: boolean
  workflow_status: string
  total_estimate: number
  currency_code: string
  stock_lock_status: "not_locked"
  error?: string
}

function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date())
  const part = (key: string) => parts.find((entry) => entry.type === key)?.value ?? "1970"
  return part("year") + "-" + part("month") + "-" + part("day")
}

function addDays(value: string, amount: number) {
  const date = new Date(value + "T00:00:00Z")
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function variantOption(item: CatalogItem, variant: CatalogItem["variants"][number]): CatalogRentalOption {
  return {
    key: "variant:" + variant.varian_barang_id,
    kind: "variant",
    barang_id: null,
    varian_barang_id: variant.varian_barang_id,
    paket_sewa_id: null,
    barang_nama: item.nama,
    varian_nama: variant.nama,
    kategori_nama: item.kategori_nama,
    price: variant.price,
    normalPrice: variant.normalPrice,
    discountPercent: variant.discountPercent,
    priceDurationValue: variant.priceDurationValue,
    priceDurationUnit: variant.priceDurationUnit,
    currency_code: variant.currency_code,
    inventory_mode: variant.inventory_mode,
  }
}

function groupCatalog(catalog: Catalog): ProductGroup[] {
  const groups = new Map<string, ProductGroup>()
  for (const item of catalog.items) {
    groups.set(item.barang_id, {
      id: item.barang_id,
      name: item.nama,
      category: item.kategori_nama,
      description: item.ringkasan_publik ?? item.deskripsi,
      imageUrl: item.imageUrl,
      rental: [...(item.directRentalOption ? [item.directRentalOption] : []), ...item.variants.map((variant) => variantOption(item, variant))],
      sale: [],
    })
  }
  for (const option of catalog.sales) {
    const existing = groups.get(option.barang_id)
    if (existing) {
      existing.sale.push(option)
      if (!existing.imageUrl && option.imageUrl) existing.imageUrl = option.imageUrl
    } else groups.set(option.barang_id, {
      id: option.barang_id,
      name: option.barang_nama,
      category: option.kategori_nama,
      description: option.deskripsi,
      imageUrl: option.imageUrl ?? null,
      rental: [],
      sale: [option],
    })
  }
  return [...groups.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}

function lineId(kind: "rental" | "sale", key: string) {
  return kind + ":" + key
}

function fromRental(option: CatalogRentalOption, quantity: number, imageUrl: string | null): BookingCartLine {
  return {
    id: lineId("rental", option.key),
    kind: "rental",
    name: option.barang_nama,
    category: option.kategori_nama,
    variant: option.varian_nama,
    quantity,
    price: option.price,
    normalPrice: option.normalPrice,
    discountPercent: option.discountPercent,
    currencyCode: option.currency_code,
    durationValue: option.priceDurationValue,
    durationUnit: option.priceDurationUnit,
    imageUrl,
    reference: {
      barang_id: option.barang_id,
      varian_barang_id: option.varian_barang_id,
      paket_sewa_id: option.paket_sewa_id,
    },
  }
}

function fromSale(option: CatalogSaleOption, quantity: number, imageUrl: string | null): BookingCartLine {
  return {
    id: lineId("sale", option.key),
    kind: "sale",
    name: option.barang_nama,
    category: option.kategori_nama,
    variant: option.varian_nama,
    quantity,
    price: option.price,
    normalPrice: option.normalPrice,
    discountPercent: option.discountPercent,
    currencyCode: option.currency_code,
    durationValue: null,
    durationUnit: null,
    imageUrl,
    reference: {
      barang_id: option.varian_barang_id ? null : option.barang_id,
      varian_barang_id: option.varian_barang_id,
      paket_sewa_id: null,
    },
  }
}

function fromPackage(item: CatalogPackage, quantity: number): BookingCartLine {
  return {
    id: "rental:package:" + item.paket_sewa_id,
    kind: "rental",
    name: item.nama,
    category: "Paket sewa",
    variant: null,
    quantity,
    price: item.price ?? 0,
    normalPrice: item.normalPrice ?? item.price ?? 0,
    discountPercent: item.discountPercent,
    currencyCode: item.currency_code,
    durationValue: item.priceDurationValue,
    durationUnit: item.priceDurationUnit,
    imageUrl: item.imageUrl,
    reference: { barang_id: null, varian_barang_id: null, paket_sewa_id: item.paket_sewa_id },
  }
}

function formatRentalPeriod(value: number | null | undefined, unit: string | null | undefined) {
  return formatTariffStayLabel(value ?? null, unit ?? null)
}

function Price({ price, normal, discount, duration }: { price: number; normal: number; discount: number; duration?: string | null }) {
  return (
    <div className="text-right">
      {discount > 0 && normal > price ? <p className="text-[10px] text-muted-foreground line-through">{formatRupiah(normal)}</p> : null}
      <p className="text-sm font-bold text-primary">{formatRupiah(price)}{duration ? <span className="ml-1 text-[10px] font-normal text-muted-foreground">/ {duration}</span> : null}</p>
    </div>
  )
}

function QuantityControl({
  value, onChange, label,
}: { value: number; onChange: (next: number) => void; label: string }) {
  return (
    <div className="inline-flex h-9 items-center rounded-xl border border-border bg-background">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label={"Kurangi " + label} className="grid size-9 place-items-center text-muted-foreground disabled:opacity-40" disabled={value <= 0}><Minus className="size-3.5" /></button>
      <span className="min-w-7 text-center text-xs font-semibold tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(MAX_QUANTITY, value + 1))} aria-label={"Tambah " + label} className="grid size-9 place-items-center text-muted-foreground disabled:opacity-40" disabled={value >= MAX_QUANTITY}><Plus className="size-3.5" /></button>
    </div>
  )
}

function Overlay({ children, onClose, labelledBy, className = "" }: { children: ReactNode; onClose: () => void; labelledBy: string; className?: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={"max-h-[94dvh] w-full overflow-y-auto border border-border/70 bg-card shadow-2xl sm:rounded-[1.5rem] " + className}>
        {children}
      </section>
    </div>
  )
}

export default function BookingCatalogExperience({ catalog, catalogLoadFailed }: { catalog: Catalog; catalogLoadFailed: boolean }) {
  const router = useRouter()
  const groups = useMemo(() => groupCatalog(catalog), [catalog])
  const categories = useMemo(() => [...new Set(groups.map((group) => group.category))].sort(), [groups])
  const today = useMemo(() => jakartaToday(), [])
  const [filter, setFilter] = useState<"all" | "rental" | "sale">("all")
  const [category, setCategory] = useState("Semua kategori")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Selection | null>(null)
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({})
  const [cart, setCart] = useState<BookingCartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [pickupDate, setPickupDate] = useState(addDays(today, 1))
  const [returnDate, setReturnDate] = useState(addDays(today, 2))
  const [note, setNote] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submissionStage, setSubmissionStage] = useState<"sending" | "preparing">("sending")
  const submittingRef = useRef(false)
  const navigationStartedRef = useRef(false)
  const pendingIdempotencyKeyRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let initialCart: BookingCartLine[] = []
    try {
      const raw = sessionStorage.getItem(CART_KEY)
      const parsed: unknown = raw ? JSON.parse(raw) : []
      if (Array.isArray(parsed)) {
        initialCart = parsed.filter((value): value is BookingCartLine => {
          if (!value || typeof value !== "object") return false
          const line = value as Partial<BookingCartLine>
          return typeof line.id === "string"
            && (line.kind === "rental" || line.kind === "sale")
            && Number.isInteger(line.quantity)
            && Number(line.quantity) > 0
            && Number(line.quantity) <= MAX_QUANTITY
            && Boolean(line.reference)
        }).slice(0, MAX_LINES)
      }
    } catch {
      try { sessionStorage.removeItem(CART_KEY) } catch { /* Storage is optional. */ }
    }
    const frame = window.requestAnimationFrame(() => {
      setCart(initialCart)
      setReady(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
    } catch {
      // Current page state remains usable when session storage is blocked.
    }
  }, [cart, ready])

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("id-ID")
    return groups.filter((group) =>
      (filter === "all" || (filter === "rental" && group.rental.length > 0) || (filter === "sale" && group.sale.length > 0))
      && (category === "Semua kategori" || group.category === category)
      && (!term || [group.name, group.category, group.description ?? ""].join(" ").toLocaleLowerCase("id-ID").includes(term)),
    )
  }, [groups, filter, category, query])

  const rentalLines = cart.filter((line) => line.kind === "rental")
  const saleLines = cart.filter((line) => line.kind === "sale")
  const hasRental = rentalLines.length > 0
  const units = cart.reduce((sum, line) => sum + line.quantity, 0)
  const linePeriods = (line: BookingCartLine) => line.kind === "rental"
    ? calculateTariffPeriodsForDates(pickupDate, returnDate, line.durationValue, line.durationUnit) ?? 1
    : 1
  const lineEstimate = (line: BookingCartLine, normal = false) => calculateRentalEstimate(
    line.quantity,
    normal ? line.normalPrice : line.price,
    linePeriods(line),
  )
  const hasUnresolvedPeriodEstimate = rentalLines.some((line) =>
    calculateTariffPeriodsForDates(pickupDate, returnDate, line.durationValue, line.durationUnit) === null,
  )
  const total = cart.reduce((sum, line) => sum + lineEstimate(line), 0)
  const normalTotal = cart.reduce((sum, line) => sum + lineEstimate(line, true), 0)
  const stayLabel = hasRental ? formatRentalStayLabel(pickupDate, returnDate) : null

  function notify(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2200)
  }

  function openProduct(group: ProductGroup) {
    const current: Record<string, number> = {}
    for (const option of group.rental) {
      const existing = cart.find((line) => line.id === lineId("rental", option.key))
      if (existing) current[lineId("rental", option.key)] = existing.quantity
    }
    for (const option of group.sale) {
      const existing = cart.find((line) => line.id === lineId("sale", option.key))
      if (existing) current[lineId("sale", option.key)] = existing.quantity
    }
    setDraftQuantities(current)
    setSelected({ kind: "product", group })
  }

  function openPackage(item: CatalogPackage) {
    const id = "rental:package:" + item.paket_sewa_id
    const existing = cart.find((line) => line.id === id)
    setDraftQuantities({ [id]: existing?.quantity ?? 0 })
    setSelected({ kind: "package", item })
  }

  function commitSelection() {
    if (!selected) return
    const replacement: BookingCartLine[] = []
    const replacedIds = new Set<string>()

    if (selected.kind === "package") {
      const item = selected.item
      const id = "rental:package:" + item.paket_sewa_id
      replacedIds.add(id)
      const quantity = draftQuantities[id] ?? 0
      if (quantity > 0 && item.canBook && item.price !== null) replacement.push(fromPackage(item, quantity))
    } else {
      const group = selected.group
      for (const option of group.rental) {
        const id = lineId("rental", option.key)
        replacedIds.add(id)
        const quantity = draftQuantities[id] ?? 0
        if (quantity > 0) replacement.push(fromRental(option, quantity, group.imageUrl))
      }
      for (const option of group.sale) {
        const id = lineId("sale", option.key)
        replacedIds.add(id)
        const quantity = draftQuantities[id] ?? 0
        if (quantity > 0) replacement.push(fromSale(option, quantity, group.imageUrl))
      }
    }

    const next = [...cart.filter((line) => !replacedIds.has(line.id)), ...replacement]
    if (next.length > MAX_LINES) {
      setError("Maksimal 10 jenis barang dalam satu booking.")
      return
    }
    if (next.some((line) => line.quantity < 1 || line.quantity > MAX_QUANTITY)) {
      setError("Jumlah setiap barang maksimal 20 unit.")
      return
    }
    setCart(next)
    setSelected(null)
    setError("")
    notify(replacement.length ? "Pilihan barang berhasil dikonfirmasi." : "Pilihan barang diperbarui.")
  }

  function changeCartQuantity(id: string, nextQuantity: number) {
    if (nextQuantity > MAX_QUANTITY) return
    setCart((current) => current
      .map((line) => line.id === id ? { ...line, quantity: nextQuantity } : line)
      .filter((line) => line.quantity > 0))
  }

  function openFinalReview() {
    setCartOpen(false)
    setError("")
    setReviewOpen(true)
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    setError("")

    const normalizedPhone = phone.replace(/\D/g, "")
    if (customerName.trim().length < 2) {
      setError("Nama minimal 2 karakter.")
      return
    }
    if (normalizedPhone.length < 8 || normalizedPhone.length > 16) {
      setError("Nomor WhatsApp tidak valid.")
      return
    }
    if (cart.length < 1 || cart.length > MAX_LINES) {
      setError("Pilih 1–10 jenis barang sebelum mengirim booking.")
      return
    }
    if (rentalLines.length > 0 && (!pickupDate || !returnDate || pickupDate < today || returnDate < pickupDate)) {
      setError("Periksa kembali tanggal pengambilan dan pengembalian.")
      return
    }
    if (note.trim().length > 500) {
      setError("Catatan maksimal 500 karakter.")
      return
    }

    const booking = {
      nama: customerName.trim(),
      telepon: phone.trim(),
      catatan: note.trim() || null,
      ...(hasRental ? { mulai_rencana: pickupDate, selesai_rencana: returnDate } : {}),
      lines: rentalLines.map((line) => ({ ...line.reference, jumlah: line.quantity })),
      purchase_lines: saleLines.map((line) => ({ ...line.reference, jumlah: line.quantity })),
    }
    let idempotencyKey: string | null = null

    try {
      idempotencyKey = getPendingBookingIdempotencyKey(sessionStorage.getItem(PENDING_KEY))
    } catch {
      // The in-memory idempotency key remains available when storage is blocked.
    }

    // Always reuse an outstanding key, even when the customer changes the form.
    // The database decides whether that key is unused (safe to create) or already
    // committed for another payload (409). This prevents both dead-end retries
    // and duplicate bookings after an uncertain network response.
    idempotencyKey ??= pendingIdempotencyKeyRef.current
    idempotencyKey ??= createClientId()
    pendingIdempotencyKeyRef.current = idempotencyKey
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ key: idempotencyKey }))
    } catch {
      // The in-memory idempotency key remains available for a retry.
    }

    navigationStartedRef.current = false
    setSubmissionStage("sending")
    submittingRef.current = true
    setSubmitting(true)
    try {
      const response = await fetch("/api/akasha-smart-booking/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        cache: "no-store",
        body: JSON.stringify({ booking }),
      })
      const body = await response.json().catch(() => ({})) as SubmitResult
      if (!response.ok) {
        const message = response.status === 409
          ? "Permintaan sebelumnya mungkin sudah diproses. Periksa portal booking atau hubungi kami sebelum mengirim ulang."
          : body.error ?? "Booking belum dapat dikirim. Periksa data lalu coba kembali."
        setError(message)
        if (!shouldRetainPendingBookingKey(response.status)) {
          try { sessionStorage.removeItem(PENDING_KEY) } catch { /* Storage is optional. */ }
          pendingIdempotencyKeyRef.current = null
        }
        return
      }
      if (!body.reference_code) {
        setError("Booking sudah tercatat tetapi nomor referensi belum diterima. Hubungi pengelola sebelum mengirim ulang.")
        return
      }

      const portalLinkUrl = typeof body.portal_link_token === "string"
        ? createPortalAccessUrl(window.location.origin, body.portal_link_token)
        : null
      const successPayload = {
        reference_code: body.reference_code,
        access_code: body.access_code,
        portal_link_url: portalLinkUrl,
        credential_requires_rotation: body.credential_requires_rotation ?? false,
        workflow_status: body.workflow_status,
        total_estimate: total,
        stay_duration_label: hasRental ? formatRentalStayLabel(pickupDate, returnDate) : null,
        currency_code: body.currency_code,
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        pickup_date: hasRental ? pickupDate : null,
        return_date: hasRental ? returnDate : null,
        lines: cart,
        created_at: new Date().toISOString(),
      }
      sessionStorage.setItem(SUCCESS_KEY, JSON.stringify(successPayload))
      sessionStorage.removeItem(PENDING_KEY)
      sessionStorage.removeItem(CART_KEY)
      pendingIdempotencyKeyRef.current = null
      setCart([])
      setSubmissionStage("preparing")
      router.replace("/booking/sukses")
      navigationStartedRef.current = true
      setReviewOpen(false)
      // Keep the blocking state visible until the success route is active.
      // A hard-navigation fallback prevents the customer from being stranded
      // on the catalog if a client-side transition is interrupted.
      window.setTimeout(() => {
        if (window.location.pathname !== "/booking/sukses") {
          window.location.assign("/booking/sukses")
        }
      }, 1800)
    } catch {
      setError("Koneksi terputus. Silakan coba kirim kembali; permintaan akan diperiksa agar tidak tercatat ganda.")
    } finally {
      if (!navigationStartedRef.current) {
        submittingRef.current = false
        setSubmitting(false)
      }
    }
  }

  const draftTotal = selected?.kind === "package"
    ? (selected.item.price ?? 0) * (draftQuantities["rental:package:" + selected.item.paket_sewa_id] ?? 0)
    : selected?.kind === "product"
      ? [
          ...selected.group.rental.map((option) => option.price * (draftQuantities[lineId("rental", option.key)] ?? 0)),
          ...selected.group.sale.map((option) => option.price * (draftQuantities[lineId("sale", option.key)] ?? 0)),
        ].reduce((sum, value) => sum + value, 0)
      : 0

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      <section className="relative isolate overflow-hidden border-b border-border/50 bg-[#172a35]">
        <div className="absolute inset-0 -z-10">
          <Image src="/bg.webp" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/40" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-center gap-2 text-[11px] text-white/65">
            <Link href="/" className="hover:text-white">Beranda</Link><ChevronRight className="size-3" /><span className="text-white">Katalog</span>
          </div>
          <div className="mt-5 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-white/90 uppercase">
              <Image src="/logo.png" alt="" width={16} height={16} className="size-4 rounded-sm object-contain" />
              AKASHA SMART BOOKING
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-4xl">Katalog Perlengkapan</h1>
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/75 sm:text-sm">Temukan perlengkapan yang Anda butuhkan, atur jumlah, lalu pilih jadwal sewa.</p>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-30 border-b border-border/70 bg-background/95 px-4 py-2 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 md:flex-row md:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <div className="inline-flex shrink-0 gap-0.5 rounded-xl bg-muted p-1" aria-label="Jenis katalog">
              {([[ "all", "Semua" ], [ "rental", "Sewa" ], [ "sale", "Beli" ]] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => { setFilter(key); if (key === "sale") setCategory("Semua kategori") }} aria-pressed={filter === key} className={"rounded-lg px-3 py-2 text-[11px] font-semibold transition " + (filter === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{label}</button>
              ))}
            </div>
            <label className="relative block min-w-0 flex-1 md:w-[170px] md:flex-none">
              <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Kategori" className="h-9 w-full appearance-none rounded-xl border border-border bg-card pl-9 pr-8 text-xs outline-none focus:border-primary/50">
                <option>Semua kategori</option>{categories.map((name) => <option key={name}>{name}</option>)}
              </select>
              <ChevronRight className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 rotate-90 text-muted-foreground" />
            </label>
          </div>
          <label className="relative block min-w-0 md:ml-auto md:w-[280px] md:shrink-0">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari perlengkapan..." aria-label="Cari perlengkapan" className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-xs outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10" />
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div><p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">Katalog publik</p><h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{filter === "rental" ? "Perlengkapan untuk disewa" : filter === "sale" ? "Barang untuk dibeli" : "Pilih kebutuhanmu"}</h2></div>
          <span className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">{visible.length} produk</span>
        </div>
        {catalogLoadFailed ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"><Package className="mx-auto size-8 text-muted-foreground/50" /><h3 className="mt-3 text-base font-semibold">Katalog belum dapat dimuat</h3><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Produk dan tarif belum tersedia. Muat ulang halaman atau hubungi pengelola.</p></div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center"><Search className="mx-auto size-8 text-muted-foreground/50" /><h3 className="mt-3 text-base font-semibold">Produk tidak ditemukan</h3><p className="mt-1 text-sm text-muted-foreground">Coba kata pencarian atau kategori lain.</p><button type="button" onClick={() => { setQuery(""); setCategory("Semua kategori"); setFilter("all") }} className="mt-4 text-sm font-semibold text-primary">Atur ulang filter</button></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((group) => {
              const bestRental = group.rental.reduce<CatalogRentalOption | null>((best, option) => !best || option.price < best.price ? option : best, null)
              const bestSale = group.sale.reduce<CatalogSaleOption | null>((best, option) => !best || option.price < best.price ? option : best, null)
              return (
                <button key={group.id} type="button" onClick={() => openProduct(group)} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-slate-950/5">
                  <div className="product-art relative aspect-square w-full">
                    {group.imageUrl ? <Image src={group.imageUrl} alt={group.name} fill unoptimized sizes="(max-width: 640px) 48vw, 20vw" className="object-contain p-3 transition duration-500 group-hover:scale-105" /> : group.rental.length > 0 ? <Tent className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-primary/55" strokeWidth={1.1} /> : <ShoppingBag className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-primary/55" strokeWidth={1.1} />}
                    <span className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full border border-border/50 bg-card/90 px-2.5 py-1 text-[9px] font-semibold text-muted-foreground">{group.category}</span>
                    {group.rental.length > 0 && group.sale.length > 0 ? <span className="absolute right-2 bottom-2 rounded-full bg-slate-950/75 px-2 py-1 text-[9px] font-semibold text-white">Sewa + Beli</span> : null}
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                    <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{group.name}</h3>
                    <div className="mt-2 flex min-h-9 flex-col justify-end gap-1">
                      {filter !== "sale" && bestRental ? <Price price={bestRental.price} normal={bestRental.normalPrice} discount={bestRental.discountPercent} duration={formatRentalPeriod(bestRental.priceDurationValue, bestRental.priceDurationUnit) ?? "sewa"} /> : null}
                      {filter !== "rental" && bestSale ? <Price price={bestSale.price} normal={bestSale.normalPrice} discount={bestSale.discountPercent} duration="beli" /> : null}
                    </div>
                    <span className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary/8 text-[11px] font-semibold text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">Pilih barang <ChevronRight className="size-3.5" /></span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {filter !== "sale" && catalog.packages.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-[11px] font-bold tracking-[0.14em] text-primary uppercase">Pilihan praktis</p><h2 className="mt-1 text-xl font-semibold tracking-tight">Paket sewa</h2></div><span className="text-xs text-muted-foreground">{catalog.packages.length} paket</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.packages.map((item) => (
              <button key={item.paket_sewa_id} type="button" disabled={!item.canBook} onClick={() => openPackage(item)} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3.5 text-left transition hover:border-primary/35 disabled:cursor-not-allowed disabled:opacity-50">
                <span className="product-art relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl">
                  {item.imageUrl ? <Image src={item.imageUrl} alt="" fill unoptimized sizes="64px" className="object-contain p-2" /> : <PackageCheck className="size-7 text-primary/60" />}
                </span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.nama}</span><span className="mt-1 block text-xs font-bold text-primary">{item.price === null ? "Tarif belum tersedia" : formatRupiah(item.price)}</span>{item.canBook && formatRentalPeriod(item.priceDurationValue, item.priceDurationUnit) ? <span className="mt-0.5 block text-[10px] text-muted-foreground">{formatRentalPeriod(item.priceDurationValue, item.priceDurationUnit)}</span> : null}{!item.canBook ? <span className="mt-0.5 block text-[10px] text-muted-foreground">Tarif belum aktif</span> : null}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 sm:flex-row sm:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-5" /></span>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Pantau booking kapan saja</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Pantau status booking dan ajukan perubahan melalui portal customer.</p></div>
          <Link href="/booking/portal" className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-semibold transition hover:border-primary/40 hover:text-primary">Cek booking <ArrowRight className="size-3.5" /></Link>
        </div>
      </section>

      {notice ? <div role="status" className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-medium text-white shadow-xl"><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-400" />{notice}</span></div> : null}

      {cart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <button type="button" onClick={() => setCartOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ShoppingCart className="size-5" /><span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{units}</span></span>
              <span className="min-w-0"><span className="block text-xs font-semibold">Keranjang sementara</span><span className="block truncate text-[11px] text-muted-foreground">{cart.length}/10 jenis · {formatRupiah(total)}</span></span>
            </button>
            <button type="button" onClick={() => setCartOpen(true)} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground sm:px-6 sm:text-sm">Tinjau keranjang <ArrowRight className="size-4" /></button>
          </div>
        </div>
      ) : null}

      {selected ? (
        <Overlay onClose={() => setSelected(null)} labelledBy="product-dialog-title" className="max-w-xl rounded-t-[1.5rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0"><p className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">{selected.kind === "package" ? "Paket sewa" : selected.group.category}</p><h2 id="product-dialog-title" className="mt-1 text-xl font-semibold tracking-tight">{selected.kind === "package" ? selected.item.nama : selected.group.name}</h2></div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Tutup pilihan barang" className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
          </div>

          {selected.kind === "package" ? (
            <div className="mt-5 rounded-xl border border-border/70 p-3">
              <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Paket lengkap</p><p className="mt-1 text-[11px] text-muted-foreground">Harga paket</p></div><Price price={selected.item.price ?? 0} normal={selected.item.normalPrice ?? selected.item.price ?? 0} discount={selected.item.discountPercent} duration={formatRentalPeriod(selected.item.priceDurationValue, selected.item.priceDurationUnit)} /></div>
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Jumlah paket</span><QuantityControl value={draftQuantities["rental:package:" + selected.item.paket_sewa_id] ?? 0} onChange={(value) => setDraftQuantities((current) => ({ ...current, ["rental:package:" + selected.item.paket_sewa_id]: value }))} label="paket" /></div>
            </div>
          ) : (
            <>
              {selected.group.description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{selected.group.description}</p> : null}
              {selected.group.rental.length > 0 ? <div className="mt-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><Tent className="size-4 text-primary" /> Pilihan sewa</div><div className="space-y-2">{selected.group.rental.map((option) => {
                const id = lineId("rental", option.key)
                return <div key={id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{option.varian_nama ?? "Barang utama"}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Durasi: {stayLabel ?? "Pilih jadwal"}</p></div><Price price={option.price} normal={option.normalPrice} discount={option.discountPercent} duration={formatRentalPeriod(option.priceDurationValue, option.priceDurationUnit) ?? "sewa"} /><QuantityControl value={draftQuantities[id] ?? 0} onChange={(value) => setDraftQuantities((current) => ({ ...current, [id]: value }))} label={option.varian_nama ?? option.barang_nama} /></div>
              })}</div></div> : null}
              {selected.group.sale.length > 0 ? <div className="mt-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><ShoppingBag className="size-4 text-primary" /> Pilihan beli</div><div className="space-y-2">{selected.group.sale.map((option) => {
                const id = lineId("sale", option.key)
                return <div key={id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{option.varian_nama ?? "Satu pilihan barang"}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Harga satuan</p></div><Price price={option.price} normal={option.normalPrice} discount={option.discountPercent} /><QuantityControl value={draftQuantities[id] ?? 0} onChange={(value) => setDraftQuantities((current) => ({ ...current, [id]: value }))} label={option.varian_nama ?? option.barang_nama} /></div>
              })}</div></div> : null}
            </>
          )}

          <div className="mt-5 rounded-xl bg-muted/45 p-3"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Subtotal pilihan</span><strong className="text-sm text-primary">{formatRupiah(draftTotal)}</strong></div><p className="mt-1 text-[10px] text-muted-foreground">Perkiraan total akan menyesuaikan lama sewa yang Anda pilih.</p></div>
          {error ? <p role="alert" className="mt-3 text-xs text-destructive">{error}</p> : null}
          <button type="button" onClick={commitSelection} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"><Check className="size-4" /> Konfirmasi pilihan barang</button>
        </Overlay>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-[95] flex justify-end bg-slate-950/50 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false) }}>
          <aside role="dialog" aria-modal="true" aria-labelledby="cart-title" className="flex h-full w-full max-w-md flex-col border-l border-border/70 bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4"><div><p className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">Pilihan Anda</p><h2 id="cart-title" className="mt-0.5 text-lg font-semibold">Keranjang sementara</h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Tutup keranjang" className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground hover:bg-muted"><X className="size-4" /></button></div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {cart.map((line) => <article key={line.id} className="flex gap-3 rounded-2xl border border-border/70 p-3"><div className="product-art relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl">{line.imageUrl ? <Image src={line.imageUrl} alt="" fill unoptimized sizes="56px" className="object-contain p-1.5" /> : line.kind === "rental" ? <Tent className="size-6 text-primary/60" /> : <ShoppingBag className="size-6 text-primary/60" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="line-clamp-2 text-xs font-semibold">{line.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{line.variant ?? line.category} · {line.kind === "rental" ? "Sewa" : "Beli"}</p></div><button type="button" onClick={() => setCart((current) => current.filter((item) => item.id !== line.id))} aria-label={"Hapus " + line.name} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5" /></button></div><div className="mt-2 flex items-center justify-between gap-2"><QuantityControl value={line.quantity} onChange={(value) => changeCartQuantity(line.id, value)} label={line.name} /><p className="text-xs font-bold text-primary">{formatRupiah(lineEstimate(line))}</p></div></div></article>)}
            </div>
            <div className="border-t border-border/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="mb-1 flex items-center justify-between text-sm"><span className="text-muted-foreground">Perkiraan biaya</span><strong className="text-lg text-primary">{formatRupiah(total)}</strong></div>
              {hasRental && stayLabel ? <p className="mb-1 text-right text-[10px] text-muted-foreground">{stayLabel} · berdasarkan tanggal pilihan</p> : null}
              {normalTotal > total ? <p className="mb-2 text-right text-[10px] text-muted-foreground">Harga normal <span className="line-through">{formatRupiah(normalTotal)}</span></p> : null}
              <button type="button" onClick={openFinalReview} disabled={cart.length === 0} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Lanjut konfirmasi booking <ArrowRight className="size-4" /></button>
            </div>
          </aside>
        </div>
      ) : null}

      {reviewOpen ? (
        <Overlay onClose={() => { if (!submitting) setReviewOpen(false) }} labelledBy="booking-review-title" className="max-w-2xl rounded-t-[1.5rem] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">Langkah terakhir</p><h2 id="booking-review-title" className="mt-1 text-xl font-semibold tracking-tight">Konfirmasi booking</h2><p className="mt-1 text-xs text-muted-foreground">Periksa pilihan Anda sebelum mengirim permintaan.</p></div><button type="button" disabled={submitting} onClick={() => setReviewOpen(false)} aria-label="Tutup konfirmasi booking" className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground disabled:opacity-40"><X className="size-4" /></button></div>

          <form onSubmit={submitBooking} className="mt-4 space-y-4">
            <section className="rounded-2xl border border-border/70 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Barang pilihan</h3><button type="button" onClick={() => { setReviewOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }) }} className="text-[10px] font-semibold text-primary">Ubah pilihan barang</button></div>
              <div className="divide-y divide-border/60">
                {cart.map((line) => <div key={line.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{line.name}{line.variant ? " · " + line.variant : ""}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{line.kind === "rental" ? "Sewa" : "Beli"} · {formatRupiah(line.price)}{line.kind === "rental" ? " / " + (formatRentalPeriod(line.durationValue, line.durationUnit) ?? "sewa") : " / unit"}</p>{line.discountPercent > 0 && line.normalPrice > line.price ? <p className="mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-300">Promo {line.discountPercent}% · harga normal <span className="line-through">{formatRupiah(line.normalPrice * line.quantity * linePeriods(line))}</span></p> : null}</div><QuantityControl value={line.quantity} onChange={(value) => changeCartQuantity(line.id, value)} label={line.name} /><div className="w-24 shrink-0 text-right"><p className="text-xs font-bold">{formatRupiah(lineEstimate(line))}</p><button type="button" onClick={() => setCart((current) => current.filter((item) => item.id !== line.id))} className="mt-1 text-[10px] font-semibold text-destructive">Hapus</button></div></div>) }
              </div>
              {cart.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">Keranjang kosong. Tambahkan barang dari katalog.</p> : null}

            </section>

            {hasRental ? (
              <section className="rounded-2xl border border-border/70 p-3 sm:p-4">
                <h3 className="mb-3 text-sm font-semibold">Pilih Jadwal</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-[11px] font-medium"><span>Tanggal ambil</span><input type="date" required min={today} value={pickupDate} onChange={(event) => { setPickupDate(event.target.value); if (returnDate < event.target.value) setReturnDate(event.target.value) }} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
                  <label className="space-y-1 text-[11px] font-medium"><span>Tanggal kembali</span><input type="date" required min={pickupDate} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/45 px-3 py-2.5"><span className="text-[11px] text-muted-foreground">Durasi sewa</span><strong className="text-xs">{stayLabel ?? "Periksa tanggal"}</strong></div>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Biaya akhir dapat menyesuaikan waktu pengambilan dan pengembalian.</p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">Perkiraan biaya</h3>
                  {hasRental ? <p className="mt-1 text-[10px] text-muted-foreground">{stayLabel ?? "Durasi sewa mengikuti tanggal pilihan"}</p> : <p className="mt-1 text-[10px] text-muted-foreground">Total barang yang Anda pilih</p>}
                </div>
                <strong className="shrink-0 text-lg font-bold text-primary">{formatRupiah(total)}</strong>
              </div>
              {normalTotal > total ? <p className="mt-1 text-right text-[10px] text-muted-foreground">Harga sebelum promo <span className="line-through">{formatRupiah(normalTotal)}</span></p> : null}
              {hasUnresolvedPeriodEstimate ? <p className="mt-2 text-[10px] leading-4 text-amber-700">Perkiraan biaya sebagian barang belum tersedia. Harga akhir akan kami konfirmasi setelah pesanan diperiksa.</p> : <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Harga akhir akan dikonfirmasi setelah pesanan diperiksa.</p>}
            </section>

            <section className="rounded-2xl border border-border/70 p-3 sm:p-4">
              <h3 className="mb-3 text-sm font-semibold">Data Anda</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-[11px] font-medium"><span>Nama lengkap</span><input autoComplete="name" required minLength={2} maxLength={120} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nama sesuai identitas" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
                <label className="space-y-1 text-[11px] font-medium"><span>Nomor WhatsApp</span><input autoComplete="tel" inputMode="tel" type="tel" required minLength={8} maxLength={24} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08xxxxxxxxxx" className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" /></label>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{hasRental ? "Jika nomor WhatsApp Anda sudah terdaftar, Anda berkesempatan mendapatkan potongan harga atau promo khusus pelanggan." : "Nomor ini digunakan untuk akses booking dan konfirmasi pesanan."}</p>
              <label className="mt-3 block space-y-1 text-[11px] font-medium"><span>Catatan <span className="font-normal text-muted-foreground">(opsional)</span></span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={2} placeholder="Ada kebutuhan khusus? Tulis di sini." className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label>
            </section>

            {error ? <p role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-xs text-destructive"><CircleAlert className="size-4 shrink-0" />{error}</p> : null}
            <div className="sticky bottom-0 -mx-4 border-t border-border/70 bg-card/95 px-4 pt-3 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6">
              <button type="submit" disabled={submitting || cart.length === 0} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55">
                {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {submitting ? "Mengirim booking..." : "Kirim booking sekarang"}
              </button>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">Tidak perlu melakukan pembayaran online saat mengirim booking.</p>
            </div>
          </form>
        </Overlay>
      ) : null}

      {submitting ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/65 px-4 py-8 backdrop-blur-md">
          <section role="dialog" aria-modal="true" aria-labelledby="booking-submission-title" aria-describedby="booking-submission-description" className="w-full max-w-sm rounded-[1.75rem] border border-white/15 bg-card px-6 py-7 text-center shadow-2xl shadow-black/25">
            <div className="relative mx-auto grid size-[4.5rem] place-items-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-8" strokeWidth={1.8} />
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-primary/15 border-t-primary" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Akasha Smart Booking</p>
            <h2 id="booking-submission-title" aria-live="polite" className="mt-2 text-lg font-semibold tracking-tight">
              {submissionStage === "preparing" ? "Menyiapkan halaman konfirmasi" : "Mengirim permintaan booking"}
            </h2>
            <p id="booking-submission-description" className="mt-2 text-sm leading-6 text-muted-foreground">
              {submissionStage === "preparing"
                ? "Pengiriman selesai. Kami sedang membuka bukti booking dan menyiapkan akses portal customer Anda."
                : "Data booking sedang diproses dengan aman. Mohon tunggu hingga proses selesai sebelum meninggalkan halaman ini."}
            </p>
            <div className="mx-auto mt-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-2/5 animate-pulse rounded-full bg-primary" />
            </div>
            <p className="mt-4 text-[10px] leading-4 text-muted-foreground">Jangan tutup atau muat ulang halaman ini.</p>
          </section>
        </div>
      ) : null}
    </div>
  )
}
