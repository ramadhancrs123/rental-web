"use client"

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, Copy, LoaderCircle, MessageCircle, Package, ShoppingBag, Tent } from "lucide-react"
import { formatRupiah, WA_NUMBER } from "@/lib/supabase"
import type { Catalog } from "@/lib/catalog"
import { createPortalAccessUrl } from "@/lib/akasha-smart-booking/portal-link"
import { createClientId } from "@/lib/client-id"
import {
  getSmartBookingCatalogOptions,
  toSmartBookingLine,
  type SmartBookingCatalogOption,
} from "@/lib/akasha-smart-booking/catalog-options"

type SubmitResult = {
  reference_code: string
  access_code: string | null
  portal_link_url?: string | null
  credential_requires_rotation?: boolean
  workflow_status: string
  reservation_number?: string | null
  total_estimate: number
  currency_code: string
  stock_lock_status: "not_locked"
}

function jakartaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "1970"
  return value("year") + "-" + value("month") + "-" + value("day")
}

function addDateDays(value: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value + "T00:00:00Z")
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function createIdempotencyKey(): string {
  return createClientId()
}

const CART_STORAGE_KEY = "akasha-smart-booking-cart-v1"
const PENDING_SUBMISSION_KEY = "akasha-smart-booking-pending-v1"
const MAX_BOOKING_LINES = 10

function displayTarget(option: SmartBookingCatalogOption): string {
  return option.varian_nama
    ? option.barang_nama + " · " + option.varian_nama
    : option.barang_nama
}

function sanitizeQuantityMap(value: unknown, validKeys: Set<string>): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const output: Record<string, number> = {}
  for (const [key, candidate] of Object.entries(value)) {
    if (!validKeys.has(key)) continue
    const quantity = Number(candidate)
    if (Number.isInteger(quantity) && quantity > 0) {
      output[key] = Math.min(20, quantity)
    }
  }
  return output
}



async function fingerprintDigest(value: string): Promise<string | null> {
  if (!window.crypto?.subtle) return null
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function clearPendingIdempotencyKey() {
  try {
    sessionStorage.removeItem(PENDING_SUBMISSION_KEY)
  } catch {
    // Storage is optional; the in-memory guard is cleared by the component.
  }
}


function formatOptionPrice(price: number, normalPrice: number, percent: number, durationValue: number | null, durationUnit: string | null) {
  const duration = durationValue && durationUnit
    ? " / " + durationValue + " " + durationUnit
    : ""
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-right">
      {percent > 0 && normalPrice > price && (
        <span className="text-xs font-normal text-muted-foreground line-through">
          {formatRupiah(normalPrice)}
        </span>
      )}
      <span className="font-semibold text-primary">{formatRupiah(price)}</span>
      <span className="text-xs font-normal text-muted-foreground">{duration}</span>
    </span>
  )
}

function groupRentalByCategory(options: SmartBookingCatalogOption[]) {
  const groups = new Map<string, SmartBookingCatalogOption[]>()
  for (const option of options) {
    const current = groups.get(option.kategori_nama) ?? []
    current.push(option)
    groups.set(option.kategori_nama, current)
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "id"))
}

export default function BookingForm({
  catalog,
  initialAdd,
  focusItemId,
}: {
  catalog: Catalog
  initialAdd?: string | null
  focusItemId?: string | null
}) {
  const router = useRouter()
  const options = useMemo(() => getSmartBookingCatalogOptions(catalog), [catalog])
  const rentals = useMemo(() => options.filter((option) => option.kind === "rental"), [options])
  const sales = useMemo(() => options.filter((option) => option.kind === "sale"), [options])
  const [activeFocusItemId] = useState<string | null>(focusItemId ?? null)
  const [selectionWarning] = useState<string | null>(() => {
    if (focusItemId && !catalog.items.some((item) => item.barang_id === focusItemId)) {
      return "Produk yang dipilih dari katalog sudah tidak tersedia. Silakan pilih item aktif."
    }
    if (initialAdd && !options.some((option) => option.key === initialAdd)) {
      return "Pilihan dari katalog sudah tidak tersedia. Silakan pilih item yang masih aktif."
    }
    return null
  })
  const focusedItem = catalog.items.find((item) => item.barang_id === activeFocusItemId) ?? null
  const focusedOptions = focusedItem
    ? rentals.filter((option) => option.barang_id === focusedItem.barang_id && option.target_kind !== "package")
    : []
  const today = useMemo(() => jakartaToday(), [])
  const [pickupDate, setPickupDate] = useState(addDateDays(today, 1))
  const [returnDate, setReturnDate] = useState(addDateDays(today, 2))
  const [rentalQty, setRentalQty] = useState<Record<string, number>>({})
  const [saleQty, setSaleQty] = useState<Record<string, number>>({})
  const [cartHydrated, setCartHydrated] = useState(false)
  const cartBootstrapped = useRef(false)
  const pendingFingerprintRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [phone, setPhone] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SubmitResult | null>(null)
  const [copied, setCopied] = useState<"reference" | "access" | "portal" | null>(null)

  useEffect(() => {
    if (cartBootstrapped.current) return
    cartBootstrapped.current = true

    let saved: {
      rentalQty?: unknown
      saleQty?: unknown
      pickupDate?: unknown
      returnDate?: unknown
    } = {}
    let legacyCartLines: unknown[] | null = null
    try {
      const raw = sessionStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          // The public catalogue stores a list of selected lines; accept that
          // shape as well as this form's normalized quantity-map format.
          legacyCartLines = parsed
        } else if (parsed && typeof parsed === "object") {
          saved = parsed as typeof saved
        }
      }
    } catch {
      saved = {}
      legacyCartLines = null
    }

    let nextRentalQty = sanitizeQuantityMap(
      saved.rentalQty,
      new Set(rentals.map((option) => option.key)),
    )
    let nextSaleQty = sanitizeQuantityMap(
      saved.saleQty,
      new Set(sales.map((option) => option.key)),
    )

    if (legacyCartLines) {
      for (const value of legacyCartLines) {
        if (!value || typeof value !== "object" || Array.isArray(value)) continue
        const line = value as {
          kind?: unknown
          quantity?: unknown
          reference?: {
            barang_id?: unknown
            varian_barang_id?: unknown
            paket_sewa_id?: unknown
          }
        }
        const quantity = Number(line.quantity)
        const reference = line.reference
        if (
          !Number.isInteger(quantity)
          || quantity <= 0
          || (line.kind !== "rental" && line.kind !== "sale")
          || !reference
        ) continue

        // Rental variants carry both their parent product and variant ID.
        // Prefer the most specific target and never submit both identifiers.
        const option = typeof reference.paket_sewa_id === "string"
          ? options.find((candidate) =>
              candidate.kind === line.kind
              && candidate.target_kind === "package"
              && candidate.paket_sewa_id === reference.paket_sewa_id)
          : typeof reference.varian_barang_id === "string"
            ? options.find((candidate) =>
                candidate.kind === line.kind
                && candidate.target_kind === "variant"
                && candidate.varian_barang_id === reference.varian_barang_id)
            : typeof reference.barang_id === "string"
              ? options.find((candidate) =>
                  candidate.kind === line.kind
                  && candidate.target_kind === "product"
                  && candidate.barang_id === reference.barang_id)
              : undefined

        if (!option) continue
        const safeQuantity = Math.min(20, quantity)
        if (option.kind === "rental") {
          nextRentalQty[option.key] = Math.min(20, (nextRentalQty[option.key] ?? 0) + safeQuantity)
        } else {
          nextSaleQty[option.key] = Math.min(20, (nextSaleQty[option.key] ?? 0) + safeQuantity)
        }
      }
    }

    if (initialAdd) {
      const option = options.find((candidate) => candidate.key === initialAdd)
      if (option) {
        if (option.kind === "rental") {
          nextRentalQty = { ...nextRentalQty, [option.key]: Math.min(20, (nextRentalQty[option.key] ?? 0) + 1) }
        } else {
          nextSaleQty = { ...nextSaleQty, [option.key]: Math.min(20, (nextSaleQty[option.key] ?? 0) + 1) }
        }
      }
    }

    setRentalQty(nextRentalQty)
    setSaleQty(nextSaleQty)
    if (typeof saved.pickupDate === "string" && saved.pickupDate >= today) {
      setPickupDate(saved.pickupDate)
    }
    if (typeof saved.returnDate === "string" && saved.returnDate >= today) {
      setReturnDate(saved.returnDate)
    }
    setCartHydrated(true)

    if (initialAdd || focusItemId) {
      router.replace(window.location.pathname, { scroll: false })
    }
  }, [focusItemId, initialAdd, options, rentals, router, sales, today])

  useEffect(() => {
    if (!cartHydrated || success) return
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
        rentalQty,
        saleQty,
        pickupDate,
        returnDate,
      }))
    } catch {
      // Cart remains usable for the current page session when storage is blocked.
    }
  }, [cartHydrated, pickupDate, rentalQty, returnDate, saleQty, success])

  const selectedRentals = rentals.filter((option) => (rentalQty[option.key] ?? 0) > 0)
  const selectedSales = sales.filter((option) => (saleQty[option.key] ?? 0) > 0)
  const rentalCount = selectedRentals.reduce((sum, option) => sum + (rentalQty[option.key] ?? 0), 0)
  const saleCount = selectedSales.reduce((sum, option) => sum + (saleQty[option.key] ?? 0), 0)
  const rentalEstimate = selectedRentals.reduce((sum, option) => sum + option.price * (rentalQty[option.key] ?? 0), 0)
  const saleEstimate = selectedSales.reduce((sum, option) => sum + option.price * (saleQty[option.key] ?? 0), 0)
  const totalEstimate = rentalEstimate + saleEstimate
  const hasRental = selectedRentals.length > 0
  const hasAnyLine = hasRental || selectedSales.length > 0

  function updateQuantity(
    setter: Dispatch<SetStateAction<Record<string, number>>>,
    key: string,
    value: number,
  ) {
    const nextValue = Math.min(20, Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)))
    const currentValue = (rentalQty[key] ?? 0) + (saleQty[key] ?? 0)
    if (nextValue > 0 && currentValue === 0 && selectedRentals.length + selectedSales.length >= MAX_BOOKING_LINES) {
      setError("Maksimal 10 jenis item dalam satu permintaan booking.")
      return
    }
    setter((previous) => ({ ...previous, [key]: nextValue }))
    setError(null)
    setSuccess(null)
  }

  async function copyValue(kind: "reference" | "access" | "portal", value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1800)
    } catch {
      setError("Clipboard tidak tersedia. Salin kode secara manual.")
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const normalizedPhone = phone.replace(/\D/g, "")
    if (customerName.trim().length < 2) {
      setError("Nama customer minimal 2 karakter.")
      return
    }
    if (normalizedPhone.length < 8 || normalizedPhone.length > 16) {
      setError("Nomor WhatsApp tidak valid.")
      return
    }
    if (!hasAnyLine) {
      setError("Pilih minimal satu perlengkapan rental atau barang pembelian.")
      return
    }
    if (hasRental) {
      if (!pickupDate || !returnDate || returnDate < pickupDate || pickupDate < today) {
        setError("Periksa kembali tanggal pengambilan dan pengembalian.")
        return
      }
    }
    if (note.trim().length > 500) {
      setError("Catatan maksimal 500 karakter.")
      return
    }

    if (selectedRentals.length + selectedSales.length > MAX_BOOKING_LINES) {
      setError("Maksimal 10 jenis item dalam satu permintaan booking.")
      return
    }

    const booking = {
      nama: customerName.trim(),
      telepon: phone.trim(),
      catatan: note.trim() || null,
      ...(hasRental ? {
        mulai_rencana: pickupDate,
        selesai_rencana: returnDate,
      } : {}),
      lines: selectedRentals.map((option) =>
        toSmartBookingLine(option, rentalQty[option.key] ?? 0)
      ),
      purchase_lines: selectedSales.map((option) =>
        toSmartBookingLine(option, saleQty[option.key] ?? 0)
      ),
    }

    const fingerprint = JSON.stringify(booking)
    const fingerprintHash = await fingerprintDigest(fingerprint)
    let idempotencyKey: string | null = null

    try {
      const raw = sessionStorage.getItem(PENDING_SUBMISSION_KEY)
      if (raw) {
        const pending = JSON.parse(raw) as {
          fingerprint_hash?: unknown
          fingerprint?: unknown
          key?: unknown
        }
        if (typeof pending.key === "string") {
          const sameFingerprint = (
            (fingerprintHash && pending.fingerprint_hash === fingerprintHash)
            || (!fingerprintHash && pendingFingerprintRef.current?.fingerprint === fingerprint)
            || (typeof pending.fingerprint === "string" && pending.fingerprint === fingerprint)
          )
          if (!sameFingerprint) {
            setError("Hasil pengiriman sebelumnya belum dapat dipastikan. Kirim ulang dengan data yang sama atau hubungi pengelola sebelum mengubah detail booking.")
            return
          }
          idempotencyKey = pending.key
        }
      }
    } catch {
      // Continue using the in-memory idempotency guard if storage cannot be read.
    }

    if (!idempotencyKey && pendingFingerprintRef.current) {
      if (pendingFingerprintRef.current.fingerprint !== fingerprint) {
        setError("Ada pengiriman booking yang belum dapat dipastikan. Gunakan data yang sama untuk mencoba kembali.")
        return
      }
      idempotencyKey = pendingFingerprintRef.current.key
    }

    if (!idempotencyKey) {
      idempotencyKey = createIdempotencyKey()
      pendingFingerprintRef.current = { fingerprint, key: idempotencyKey }
      try {
        sessionStorage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify({
          fingerprint_hash: fingerprintHash,
          key: idempotencyKey,
        }))
      } catch {
        // The in-memory key still protects retries in the current page session.
      }
    } else {
      pendingFingerprintRef.current = { fingerprint, key: idempotencyKey }
      if (fingerprintHash) {
        try {
          sessionStorage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify({
            fingerprint_hash: fingerprintHash,
            key: idempotencyKey,
          }))
        } catch {
          // The in-memory guard remains active.
        }
      }
    }

    setBusy(true)
    try {
      const response = await fetch("/api/akasha-smart-booking/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        cache: "no-store",
        body: JSON.stringify({ booking }),
      })
      const body = await response.json().catch(() => ({})) as SubmitResult & { portal_link_token?: unknown; error?: string }
      if (!response.ok) {
        setError(body.error ?? "Permintaan booking belum dapat diproses.")
        if ([400, 404, 409].includes(response.status)) {
          clearPendingIdempotencyKey()
          pendingFingerprintRef.current = null
        }
        return
      }
      if (!body.reference_code) {
        setError("Booking tercatat, tetapi nomor referensi belum diterima. Hubungi pengelola sebelum mengirim ulang.")
        return
      }
      const { portal_link_token: portalLinkToken, ...bookingResult } = body
      const portalLinkUrl = typeof portalLinkToken === "string"
        ? createPortalAccessUrl(window.location.origin, portalLinkToken)
        : null
      setSuccess({ ...bookingResult, portal_link_url: portalLinkUrl })
      try {
        clearPendingIdempotencyKey()
        sessionStorage.removeItem(CART_STORAGE_KEY)
        pendingFingerprintRef.current = null
      } catch {
        // A completed booking is still successful if browser storage is unavailable.
      }
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setError("Jaringan terputus. Kirim ulang dengan data yang sama agar sistem memakai kunci idempotensi yang sama.")
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <section className="space-y-5">
        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-7">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Check className="size-5" />
            <span className="text-sm font-semibold">Permintaan booking tercatat</span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Akses portal booking Anda</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
Masuk ke portal cukup dengan kode akses, atau buka tautan pribadi di bawah. Nomor referensi tetap berguna saat menghubungi pengelola. Simpan akses ini sebelum meninggalkan halaman.
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nomor referensi</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <code className="break-all text-xl font-bold tracking-wider">{success.reference_code}</code>
            <button type="button" onClick={() => copyValue("reference", success.reference_code)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold">
              {copied === "reference" ? <Check className="size-4" /> : <Copy className="size-4" />} Salin
            </button>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kode akses customer</p>
          {success.access_code ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <code className="break-all text-2xl font-bold tracking-widest text-primary">{success.access_code}</code>
              <button type="button" onClick={() => copyValue("access", success.access_code as string)} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold">
                {copied === "access" ? <Check className="size-4" /> : <Copy className="size-4" />} Salin
              </button>
            </div>
          ) : (
            <p className="mt-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              Booking sudah tercatat, tetapi kode akses dan tautan pribadi tidak dapat ditampilkan ulang pada pengiriman yang diulang. Simpan nomor referensi dan hubungi pengelola untuk meminta penerbitan akses baru.
            </p>
          )}

          {success.portal_link_url && (
            <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tautan pribadi ke portal</p>
              <p className="mt-2 break-all text-sm font-medium text-primary">{success.portal_link_url}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={success.portal_link_url} className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground">
                  Buka portal pribadi
                </Link>
                <button type="button" onClick={() => copyValue("portal", success.portal_link_url as string)} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold">
                  {copied === "portal" ? <Check className="size-4" /> : <Copy className="size-4" />} Salin tautan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const shareData = {
                      title: "Portal Booking Akasha Outdoor",
                      text: "Gunakan tautan pribadi ini untuk melihat status booking Akasha Outdoor. Jangan bagikan kepada orang lain.",
                      url: success.portal_link_url as string,
                    }
                    if (navigator.share) {
                      void navigator.share(shareData).catch(() => undefined)
                    } else {
                      void copyValue("portal", success.portal_link_url as string)
                    }
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold"
                >
                  <MessageCircle className="size-4" /> Bagikan
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Tautan ini membuka booking secara langsung. Perlakukan seperti kode akses dan jangan bagikan secara publik.</p>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-border/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ringkasan permintaan</p>
            <div className="mt-3 divide-y divide-border/60">
              {[...selectedRentals, ...selectedSales].map((option) => {
                const quantity = option.kind === "rental" ? rentalQty[option.key] ?? 0 : saleQty[option.key] ?? 0
                return (
                  <div key={option.key} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0">{option.kind === "rental" ? "Sewa" : "Beli"} · {displayTarget(option)} × {quantity}</span>
                    <strong className="shrink-0">{formatRupiah(option.price * quantity)}</strong>
                  </div>
                )
              })}
            </div>
            {hasRental && <p className="mt-2 text-xs text-muted-foreground">Periode: {pickupDate} sampai {returnDate}</p>}
          </div>

          <div className="mt-6 rounded-2xl bg-muted/50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <strong className="font-semibold">Menunggu peninjauan</strong>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimasi tarif dasar</span>
              <strong>{formatRupiah(success.total_estimate ?? 0)}</strong>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Nilai rental merupakan estimasi tarif untuk periode 2 hari 1 malam per item, bukan tagihan final. Harga dan ketersediaan akan diperiksa kembali oleh pengelola. Booking ini tidak mengunci stok dan belum menjadi transaksi.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <a
              href={"https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent("Halo Akasha Outdoor, saya sudah mengirim booking dengan nomor referensi " + success.reference_code + ". Mohon bantu tinjau permintaan saya.")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            >
              Hubungi pengelola
            </a>
            <Link href={success.portal_link_url ?? "/booking/portal"} className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
              Lihat status booking
            </Link>
            <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold">
              Cetak / simpan bukti kode
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {selectionWarning && (
        <p role="alert" className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm text-amber-800 dark:text-amber-200">
          {selectionWarning}
        </p>
      )}

      {focusedItem && focusedOptions.length > 0 && (
        <section className="rounded-3xl border border-primary/25 bg-primary/[0.04] p-5 sm:p-6">
          <h2 className="text-base font-semibold">Pilih {focusedItem.nama}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Pilih varian yang Anda maksud, lalu lanjutkan memilih item lain bila diperlukan.
          </p>
          <div className="mt-3 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
            {focusedOptions.map((option) => {
              const count = rentalQty[option.key] ?? 0
              return (
                <div key={option.key} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{displayTarget(option)}</p>
                    <div className="mt-1 text-xs">
                      {formatOptionPrice(option.price, option.normalPrice, option.discountPercent, option.priceDurationValue, option.priceDurationUnit)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={() => updateQuantity(setRentalQty, option.key, count - 1)} disabled={count <= 0} aria-label={"Kurangi " + displayTarget(option)} className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">−</button>
                    <span className="min-w-5 text-center text-sm font-semibold">{count}</span>
                    <button type="button" onClick={() => updateQuantity(setRentalQty, option.key, count + 1)} disabled={count >= 20} aria-label={"Tambah " + displayTarget(option)} className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">+</button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Tent className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Perlengkapan rental</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Pilih barang atau varian yang dibutuhkan. Tarif yang ditampilkan mengikuti katalog aktif dan menjadi dasar pemeriksaan pengelola.
        </p>
        {rentals.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Belum ada opsi rental publik yang memiliki tarif aktif.
          </p>
        ) : (
          <details className="mt-4 rounded-2xl border border-border/60 p-3 sm:p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              <span>Atur pilihan rental</span>
              <span className="text-xs font-medium text-muted-foreground">{selectedRentals.length} jenis · {rentalCount} unit</span>
            </summary>
            <div className="mt-5 space-y-5">
            {groupRentalByCategory(rentals).map(([category, group]) => (
              <div key={category}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{category}</h3>
                <div className="divide-y divide-border/60 rounded-2xl border border-border/60">
                  {group.map((option) => {
                    const count = rentalQty[option.key] ?? 0
                    return (
                      <div key={option.key} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{displayTarget(option)}</p>
                          <div className="mt-1 text-xs">
                            {formatOptionPrice(option.price, option.normalPrice, option.discountPercent, option.priceDurationValue, option.priceDurationUnit)}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button type="button" aria-label={"Kurangi " + displayTarget(option)} onClick={() => updateQuantity(setRentalQty, option.key, count - 1)} disabled={count <= 0} className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">−</button>
                          <input aria-label={"Jumlah " + displayTarget(option)} type="number" min={0} max={20} value={count} onChange={(event) => updateQuantity(setRentalQty, option.key, Number(event.target.value))} className="h-8 w-12 rounded-lg border border-border bg-background text-center text-sm" />
                          <button type="button" aria-label={"Tambah " + displayTarget(option)} onClick={() => updateQuantity(setRentalQty, option.key, count + 1)} disabled={count >= 20} className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            </div>
          </details>
        )}
        {hasRental ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">Tanggal pengambilan</span>
                <input type="date" min={today} value={pickupDate} onChange={(event) => {
                  const value = event.target.value
                  setPickupDate(value)
                  if (value && returnDate < value) setReturnDate(value)
                }} className="h-11 w-full rounded-xl border border-border bg-background px-3" />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="font-medium">Tanggal pengembalian</span>
                <input type="date" min={pickupDate || today} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3" />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tarif yang ditampilkan merupakan estimasi untuk periode 2 hari 1 malam. Nilai final diperiksa kembali oleh pengelola.</p>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">
            Tanggal rental tidak diperlukan untuk permintaan pembelian saja. Tambahkan item sewa untuk menentukan periode pengambilan dan pengembalian.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Pembelian tambahan</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Barang yang memang diaktifkan untuk penjualan. Pembelian tetap menjadi bagian terpisah saat checkout operasional.
        </p>
        {catalog.sales.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Belum ada barang jual publik yang aktif.</p>
        ) : (
          <details className="mt-4 rounded-2xl border border-border/60 p-3 sm:p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              <span>Atur pilihan pembelian</span>
              <span className="text-xs font-medium text-muted-foreground">{selectedSales.length} jenis · {saleCount} unit</span>
            </summary>
            <div className="mt-4 divide-y divide-border/60 rounded-2xl border border-border/60">
            {sales.map((option) => {
              const count = saleQty[option.key] ?? 0
              return (
                <div key={option.key} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{option.barang_nama}{option.varian_nama ? " · " + option.varian_nama : ""}</p>
                    <div className="mt-1 text-xs">{formatOptionPrice(option.price, option.normalPrice, option.discountPercent, null, null)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" aria-label={"Kurangi " + option.barang_nama} onClick={() => updateQuantity(setSaleQty, option.key, count - 1)} disabled={count <= 0} className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">−</button>
                    <input aria-label={"Jumlah " + option.barang_nama} type="number" min={0} max={20} value={count} onChange={(event) => updateQuantity(setSaleQty, option.key, Number(event.target.value))} className="h-8 w-12 rounded-lg border border-border bg-background text-center text-sm" />
                    <button type="button" aria-label={"Tambah " + option.barang_nama} onClick={() => updateQuantity(setSaleQty, option.key, count + 1)} disabled={count >= 20} className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">+</button>
                  </div>
                </div>
              )
            })}
            </div>
          </details>
        )}
      </section>

      <section className="rounded-3xl border border-primary/20 bg-primary/[0.035] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Ringkasan pilihan Anda</h2>
          <span className="text-xs text-muted-foreground">{selectedRentals.length + selectedSales.length}/10 jenis item</span>
        </div>
        {!hasAnyLine ? (
          <p className="mt-3 text-sm text-muted-foreground">Pilih perlengkapan rental atau pembelian. Pilihan Anda akan muncul di sini.</p>
        ) : (
          <div className="mt-3 divide-y divide-border/60">
            {[...selectedRentals, ...selectedSales].map((option) => {
              const quantity = option.kind === "rental" ? rentalQty[option.key] ?? 0 : saleQty[option.key] ?? 0
              const setter = option.kind === "rental" ? setRentalQty : setSaleQty
              return (
                <div key={option.key} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{option.kind === "rental" ? "Sewa" : "Beli"} · {displayTarget(option)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {quantity} unit · {formatRupiah(option.price)}{option.priceDurationValue && option.priceDurationUnit ? " / " + option.priceDurationValue + " " + option.priceDurationUnit : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{formatRupiah(option.price * quantity)}</p>
                    <button type="button" onClick={() => updateQuantity(setter, option.key, 0)} className="mt-1 text-xs font-medium text-destructive underline underline-offset-2">
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-2 border-t border-border/60 pt-3 text-xs leading-5 text-muted-foreground">
          Tarif rental merupakan dasar per siklus. Periode dan nilai final diperiksa kembali oleh pengelola. Pembelian dihitung sekali sesuai jumlah.
        </p>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-primary" />
          <h2 className="text-base font-semibold">Informasi customer</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Nama lengkap</span>
            <input value={customerName} onChange={(event) => { setCustomerName(event.target.value); setSuccess(null) }} maxLength={120} autoComplete="name" required className="h-11 w-full rounded-xl border border-border bg-background px-3" placeholder="Nama customer" />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Nomor WhatsApp</span>
            <input value={phone} onChange={(event) => { setPhone(event.target.value); setSuccess(null) }} maxLength={30} inputMode="tel" autoComplete="tel" required className="h-11 w-full rounded-xl border border-border bg-background px-3" placeholder="08xx xxxx xxxx" />
          </label>
        </div>
        <label className="mt-4 block space-y-1.5 text-sm">
          <span className="font-medium">Catatan (opsional)</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} rows={3} className="w-full rounded-xl border border-border bg-background p-3" placeholder="Informasi tambahan untuk pengelola" />
        </label>
      </section>

      <section className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-5 sm:p-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{selectedRentals.length + selectedSales.length}/10 jenis item · {rentalCount} unit rental · {saleCount} barang beli</span>
          <span>Estimasi awal</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-base font-semibold">Estimasi tarif dasar</span>
          <strong className="text-2xl font-bold text-primary">{formatRupiah(totalEstimate)}</strong>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Nilai rental ditampilkan untuk periode 2 hari 1 malam per item, sedangkan pembelian dihitung satu kali. Total akhir mengikuti durasi dan ketentuan serah-terima yang ditetapkan saat pemeriksaan pengelola. Ini bukan invoice atau tagihan final.
        </p>
        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
          </div>
        )}
        <button type="submit" disabled={busy || !hasAnyLine || !cartHydrated} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <><LoaderCircle className="size-4 animate-spin" /> Mengirim permintaan...</> : "Kirim permintaan booking"}
        </button>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <MessageCircle className="size-3.5 text-primary" />
          Butuh bantuan?
          <a href={"https://wa.me/" + WA_NUMBER} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">Chat pengelola</a>
        </div>
      </section>
    </form>
  )
}
