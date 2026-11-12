"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import Image from "next/image"
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clipboard,
  Download,
  FileText,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Tent,
  Trash2,
  X,
} from "lucide-react"
import { formatRupiah } from "@/lib/supabase"
import { parsePortalAccessFragment } from "@/lib/akasha-smart-booking/portal-link"
import { createClientId } from "@/lib/client-id"
import {
  calculateRentalEstimate,
  calculateTariffPeriodsForDates,
  formatRentalStayLabel,
  getMinimumSchedulePickupDate,
  isValidSchedulePickupDate,
} from "@/lib/rental-estimate"
import { getAvailabilityIndicator, isAvailabilityConditional, isAvailabilityShortage } from "@/lib/akasha-smart-booking/availability"
import { createBookingReceiptQr, exportBookingReceipt, type BookingReceipt } from "@/lib/akasha-smart-booking/booking-receipt"
import type { Catalog } from "@/lib/catalog"
import {
  getSmartBookingCatalogOptions,
  hasSmartBookingQuantityChanges,
  toSmartBookingLine,
  type SmartBookingCatalogOption,
} from "@/lib/akasha-smart-booking/catalog-options"

type PortalLine = {
  line_id: string
  kind: "rental" | "sale"
  name: string
  variant: string | null
  barang_id: string | null
  varian_barang_id: string | null
  paket_sewa_id: string | null
  quantity: number
  unit_price: number
  normal_price: number
  discount_percent: number
  discount_amount: number
  subtotal: number
  currency_code: string
}

type ChangeRequest = {
  id: string
  type: string
  status: string
  payload: Record<string, unknown>
  reason: string | null
  public_resolution_note: string | null
  created_at: string
  resolved_at: string | null
}

type PortalTransactionTracking = {
  converted_at: string
  checkout_number: string | null
  rental: null | {
    rental_number: string
    status: string
    scheduled_pickup_at: string
    scheduled_return_at: string
    actual_pickup_at: string | null
    actual_return_started_at: string | null
    actual_return_completed_at: string | null
    tolerance_deadline: string | null
    total_amount: number
    currency_code: string
    lines: Array<{
      name: string
      variant: string | null
      quantity: number
      assigned_unit_count: number
      progress_status: string
    }>
  }
  sale: null | {
    sale_number: string
    status: string
    payment_status: string
    created_at: string
    total_amount: number
    currency_code: string
    lines: Array<{
      name: string
      variant: string | null
      quantity: number
      subtotal: number
      is_bonus: boolean
    }>
  }
}

type PortalData = {
  reference_code: string
  workflow_status: string
  customer_name: string
  requested_pickup_date: string | null
  requested_return_date: string | null
  requested_pickup_at: string | null
  requested_return_at: string | null
  business_timezone: string
  quote_total: number
  dp_amount: number | null
  currency_code: string
  quote_expires_at: string | null
  revision: number
  created_at: string
  lines: PortalLine[]
  change_requests: ChangeRequest[]
  timeline: Array<{ type: string; message: string | null; occurred_at: string }>
  transaction_tracking?: PortalTransactionTracking | null
}

type AvailabilityComponent = {
  component_name?: string
  requested_variant?: string | null
  required_quantity?: number
  availability?: {
    ready_now_across_variants?: number | null
    ready_now_requested_variant?: number | null
    potential_returns_before_pickup_across_variants?: number | null
    potential_returns_before_pickup_requested_variant?: number | null
    available_now_across_variants?: number | null
    available_now_requested_variant?: number | null
    status?: string
  }
}

type AvailabilityLine = {
  kind: "rental" | "sale"
  item_name: string
  variant_name: string | null
  requested_quantity: number
  status: string
  components?: AvailabilityComponent[]
}

type AvailabilityData = {
  checked_at: string
  requested_pickup_date: string | null
  return_tolerance_hours: number
  inventory_is_reserved: false
  availability_is_guaranteed: false
  customer_notice?: string
  lines: AvailabilityLine[]
}

const PENDING_CHANGE_STORAGE_KEY = "akasha-smart-booking-pending-change-v1"
const MAX_CHANGE_LINES = 10

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    received: "Booking diterima",
    reviewing: "Ditinjau admin",
    acknowledged: "Booking dikonfirmasi",
    customer_action_required: "Perlu tindakan",
    change_requested: "Perubahan diajukan",
    cancellation_pending: "Pembatalan diajukan",
    ready_for_checkout: "Booking dikonfirmasi",
    cancelled: "Dibatalkan",
    expired: "Kedaluwarsa",
    fulfilled: "Selesai",
  }
  return labels[status] ?? "Status sedang diperbarui"
}

function formatPortalDate(value: string | null) {
  if (!value) return "Belum ditentukan"
  const date = new Date(value + "T12:00:00Z")
  if (Number.isNaN(date.getTime())) return "Belum ditentukan"
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(date)
}

function formatPortalDateTime(value: string | null, timezone: string) {
  if (!value) return "Belum tersedia"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Waktu tidak tersedia"
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone || "Asia/Jakarta",
  }).format(date)
}

function rentalProgressLabel(status: string) {
  const labels: Record<string, string> = {
    preparing: "Disiapkan",
    prepared: "Siap diserahkan",
    ready_for_pickup: "Siap diambil",
    handed_over: "Sudah diserahkan",
    return_in_progress: "Pengembalian diperiksa",
    returned: "Sudah dikembalikan",
  }
  return labels[status] ?? "Sedang diproses"
}

function rentalTrackingLabel(
  status: string,
  actualPickupAt: string | null,
  returnCompletedAt: string | null,
  returnStartedAt: string | null,
) {
  if (returnCompletedAt) return "Sudah dikembalikan"
  if (returnStartedAt) return "Pengembalian diperiksa"
  if (actualPickupAt) return "Penyewaan aktif · barang telah diserahkan"
  const labels: Record<string, string> = {
    draft: "Menunggu penyiapan barang",
    ready_for_pickup: "Siap diambil",
    active: "Penyewaan aktif",
    return_in_progress: "Pengembalian diperiksa",
    completed: "Sudah dikembalikan",
    cancelled: "Penyewaan dibatalkan",
  }
  return labels[status] ?? "Sedang diproses"
}

function saleTrackingLabel(status: string) {
  const labels: Record<string, string> = {
    completed: "Pembelian tercatat",
    draft: "Pembelian sedang diproses",
    cancelled: "Pembelian dibatalkan",
  }
  return labels[status] ?? "Pembelian tercatat"
}

function availabilityLabel(status: string) {
  return getAvailabilityIndicator(status).label
}

function requestTypeLabel(type: string) {
  const labels: Record<string, string> = {
    item_change: "Perubahan barang",
    variant_change: "Perubahan varian",
    quantity_change: "Perubahan jumlah",
    schedule_change: "Perubahan jadwal",
    cancellation: "Pembatalan",
    alternative_interest: "Minat pada alternatif",
    other: "Permintaan lainnya",
  }
  return labels[type] ?? "Permintaan booking"
}

function requestStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Menunggu ditinjau",
    approved: "Disetujui",
    rejected: "Belum disetujui",
    withdrawn: "Dibatalkan",
    applied: "Sudah diterapkan",
  }
  return labels[status] ?? "Status diperbarui"
}

function optionKeyFromPortalLine(line: PortalLine): string | null {
  if (line.kind === "sale") {
    if (line.varian_barang_id) return "sale-variant:" + line.varian_barang_id
    if (line.barang_id) return "sale-product:" + line.barang_id
    return null
  }
  if (line.paket_sewa_id) return "package:" + line.paket_sewa_id
  if (line.varian_barang_id) return "variant:" + line.varian_barang_id
  if (line.barang_id) return "product:" + line.barang_id
  return null
}

function buildDraftQuantities(
  lines: PortalLine[],
  optionByKey: Map<string, SmartBookingCatalogOption>,
) {
  const result: Record<string, number> = {}
  for (const line of lines) {
    const key = optionKeyFromPortalLine(line)
    if (!key || !optionByKey.has(key)) continue
    result[key] = Math.min(20, Math.max(1, Number(line.quantity) || 1))
  }
  return result
}



async function readJson(response: Response) {
  return response.json().catch(() => ({})) as Promise<Record<string, unknown>>
}

async function fingerprintDigest(value: string): Promise<string | null> {
  if (!window.crypto?.subtle) return null
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function createIdempotencyKey(fingerprint: string): Promise<string | null> {
  const fingerprintHash = await fingerprintDigest(fingerprint)
  try {
    const raw = sessionStorage.getItem(PENDING_CHANGE_STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as {
        fingerprint_hash?: unknown
        fingerprint?: unknown
        key?: unknown
      }
      if (typeof saved.key === "string") {
        if (fingerprintHash && saved.fingerprint_hash === fingerprintHash) {
          return saved.key
        }
        // Migrate a previous session's in-tab record without preserving PII.
        if (typeof saved.fingerprint === "string" && saved.fingerprint === fingerprint) {
          sessionStorage.setItem(PENDING_CHANGE_STORAGE_KEY, JSON.stringify({
            fingerprint_hash: fingerprintHash,
            key: saved.key,
          }))
          return saved.key
        }
        return null
      }
    }
  } catch {
    // In-memory map still protects retries in the current page session.
  }

  const key = createClientId()
  try {
    sessionStorage.setItem(PENDING_CHANGE_STORAGE_KEY, JSON.stringify({
      fingerprint_hash: fingerprintHash,
      key,
    }))
  } catch {
    // Server-side idempotency remains available for the active page session.
  }
  return key
}

function clearPendingChangeKey() {
  try {
    sessionStorage.removeItem(PENDING_CHANGE_STORAGE_KEY)
  } catch {
    // Storage is optional.
  }
}

export default function BookingPortalClient({ catalog }: { catalog: Catalog }) {
  const options = useMemo(() => getSmartBookingCatalogOptions(catalog), [catalog])
  const optionByKey = useMemo(
    () => new Map(options.map((option) => [option.key, option])),
    [options],
  )
  const [accessCode, setAccessCode] = useState("")
  const [portal, setPortal] = useState<PortalData | null>(null)
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [availabilityRefreshError, setAvailabilityRefreshError] = useState<string | null>(null)
  const [availabilityStaleCheck, setAvailabilityStaleCheck] = useState<{
    checkedAt: string
    stale: boolean
  } | null>(null)
  const availabilityIsStale = Boolean(
    availabilityStaleCheck
    && availability?.checked_at
    && availabilityStaleCheck.checkedAt === availability.checked_at
    && availabilityStaleCheck.stale,
  )
  const [pickupDate, setPickupDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [schedulePickupDate, setSchedulePickupDate] = useState("")
  const [scheduleReturnDate, setScheduleReturnDate] = useState("")
  const [draftQty, setDraftQty] = useState<Record<string, number>>({})
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogCategory, setCatalogCategory] = useState("Semua")
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "tracking" | "manage" | "history">("overview")
  const [manageDialog, setManageDialog] = useState<"items" | "schedule" | null>(null)
  const [alternativeDraft, setAlternativeDraft] = useState<{ line: PortalLine; option: SmartBookingCatalogOption } | null>(null)
  const [receiptQrDataUrl, setReceiptQrDataUrl] = useState<string | null>(null)
  const [receiptExporting, setReceiptExporting] = useState<"png" | "pdf" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const changeIdempotencyKeysRef = useRef(new Map<string, string>())
  const portalBootstrapRef = useRef<Promise<{ portal: PortalData | null; availability: AvailabilityData | null; error: string | null }> | null>(null)
  const originalDraftQty = useMemo(
    () => buildDraftQuantities(portal?.lines ?? [], optionByKey),
    [portal?.lines, optionByKey],
  )
  const draftHasChanges = portal
    ? hasSmartBookingQuantityChanges(originalDraftQty, draftQty)
    : false

  function applyPortalData(data: PortalData) {
    setPortal(data)
    setPickupDate(data.requested_pickup_date ?? "")
    setReturnDate(data.requested_return_date ?? "")
    setDraftQty(buildDraftQuantities(data.lines ?? [], optionByKey))
    setCatalogOpen(false)
  }

  function openItemsDialog() {
    if (!portal) return
    setDraftQty(buildDraftQuantities(portal.lines ?? [], optionByKey))
    setCatalogSearch("")
    setCatalogCategory("Semua")
    setCatalogOpen(false)
    setError(null)
    setManageDialog("items")
  }

  async function copyBookingCode() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(portal?.reference_code ?? "")
      setMessage("Kode reservasi berhasil disalin.")
    } catch {
      setMessage("Kode reservasi Anda: " + (portal?.reference_code ?? ""))
    }
  }

  async function loadPortal() {
    const response = await fetch("/api/akasha-smart-booking/portal", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    })
    const body = await readJson(response)
    if (!response.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Sesi portal tidak ditemukan.")
    }
    const data = body as unknown as PortalData
    applyPortalData(data)
    return data
  }

  useEffect(() => {
    if ((!manageDialog && !alternativeDraft && !catalogOpen) || submitting) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (catalogOpen) {
        setCatalogOpen(false)
        return
      }
      setManageDialog(null)
      setAlternativeDraft(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [manageDialog, alternativeDraft, catalogOpen, submitting])

  useEffect(() => {
    const checkedAt = availability?.checked_at
    if (!checkedAt) return

    const updateStaleState = () => {
      const checkedAtMs = new Date(checkedAt).getTime()
      setAvailabilityStaleCheck({
        checkedAt,
        stale: !Number.isFinite(checkedAtMs) || Date.now() - checkedAtMs > 180_000,
      })
    }
    const initialCheck = window.setTimeout(updateStaleState, 0)
    const interval = window.setInterval(updateStaleState, 30_000)
    return () => {
      window.clearTimeout(initialCheck)
      window.clearInterval(interval)
    }
  }, [availability?.checked_at])

  async function loadAvailability() {
    const response = await fetch("/api/akasha-smart-booking/portal/availability", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
    })
    const body = await readJson(response)
    if (!response.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Ketersediaan belum dapat dimuat.")
    }
    setAvailability(body as unknown as AvailabilityData)
  }

  useEffect(() => {
    let alive = true

    // Share one bootstrap promise across React Strict Mode's development
    // setup/cleanup replay so a private link is exchanged exactly once.
    if (!portalBootstrapRef.current) {
      portalBootstrapRef.current = (async () => {
        let linkLoginError: string | null = null
        const fragment = parsePortalAccessFragment(window.location.hash)

        if (fragment.present) {
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search,
          )
          if (fragment.token) {
            try {
              const linkResponse = await fetch("/api/akasha-smart-booking/portal/link-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
                credentials: "same-origin",
                body: JSON.stringify({ portal_link_token: fragment.token }),
              })
              const linkBody = await readJson(linkResponse)
              if (!linkResponse.ok) {
                linkLoginError = typeof linkBody.error === "string"
                  ? linkBody.error
                  : "Tautan pribadi tidak valid atau telah kedaluwarsa."
              }
            } catch {
              linkLoginError = "Tautan pribadi belum dapat diverifikasi. Periksa koneksi lalu buka tautan kembali."
            }
          } else {
            linkLoginError = "Tautan pribadi tidak valid atau telah kedaluwarsa."
          }
        }

        try {
          const response = await fetch("/api/akasha-smart-booking/portal", {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
          })
          const body = await readJson(response)
          if (!response.ok) {
            return {
              portal: null,
              availability: null,
              error: response.status === 401
                ? linkLoginError
                : typeof body.error === "string"
                  ? body.error
                  : "Portal sementara tidak dapat diakses.",
            }
          }

          const portalData = body as unknown as PortalData
          let availability: AvailabilityData | null = null
          if (!portalData.transaction_tracking) {
            const availabilityResponse = await fetch("/api/akasha-smart-booking/portal/availability", {
              method: "GET",
              cache: "no-store",
              credentials: "same-origin",
            })
            if (availabilityResponse.ok) {
              availability = await readJson(availabilityResponse) as unknown as AvailabilityData
            }
          }

          return {
            portal: portalData,
            availability,
            error: null,
          }
        } catch {
          return {
            portal: null,
            availability: null,
            error: linkLoginError,
          }
        }
      })()
    }

    void portalBootstrapRef.current.then((result) => {
      if (!alive) return
      if (result.portal) applyPortalData(result.portal)
      if (result.availability) setAvailability(result.availability)
      if (result.error) setError(result.error)
    }).finally(() => {
      if (alive) setLoading(false)
    })

    return () => { alive = false }
  // optionByKey is stable for the lifetime of the public catalog response.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!portal?.reference_code) return
    let active = true
    let inFlight = false

    async function refreshPortalProgress() {
      if (
        !active ||
        inFlight ||
        submitting ||
        draftHasChanges ||
        catalogOpen ||
        document.visibilityState !== "visible"
      ) return
      inFlight = true
      try {
        const response = await fetch("/api/akasha-smart-booking/portal", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        })
        const body = await readJson(response)
        if (!response.ok) {
          if (response.status === 401 && active) {
            setPortal(null)
            setAvailability(null)
            setError("Sesi portal telah berakhir. Silakan masuk kembali dengan kode akses atau tautan pribadi.")
          }
          return
        }
        if (active && !submitting && !draftHasChanges && !catalogOpen) {
          const latestPortal = body as unknown as PortalData
          setPortal(latestPortal)
          setPickupDate(latestPortal.requested_pickup_date ?? "")
          setReturnDate(latestPortal.requested_return_date ?? "")
          setDraftQty(buildDraftQuantities(latestPortal.lines ?? [], optionByKey))
          setCatalogOpen(false)
          if (latestPortal.transaction_tracking) {
            setAvailability(null)
          } else {
            const availabilityResponse = await fetch("/api/akasha-smart-booking/portal/availability", {
              method: "GET",
              cache: "no-store",
              credentials: "same-origin",
            })
            const availabilityBody = await readJson(availabilityResponse)
            if (availabilityResponse.ok) {
              setAvailability(availabilityBody as unknown as AvailabilityData)
              setAvailabilityRefreshError(null)
            } else {
              setAvailabilityRefreshError(
                typeof availabilityBody.error === "string"
                  ? availabilityBody.error
                  : "Stok belum dapat diperbarui.",
              )
            }
          }
        }
      } catch {
        // Keep the last verified booking and tracking state during brief network loss.
      } finally {
        inFlight = false
      }
    }

    const interval = window.setInterval(() => void refreshPortalProgress(), 60_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshPortalProgress()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [portal?.reference_code, draftHasChanges, catalogOpen, optionByKey, submitting])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)
    try {
      const response = await fetch("/api/akasha-smart-booking/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ access_code: accessCode.trim().toUpperCase() }),
      })
      const body = await readJson(response)
      if (!response.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Kode akses tidak sesuai.")
      }
      await loadPortal()
      await loadAvailability().catch(() => undefined)
      setActiveTab("overview")
      setManageDialog(null)
      setMessage("Berhasil masuk ke portal booking.")
      setAccessCode("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Portal booking belum dapat diakses.")
    } finally {
      setSubmitting(false)
    }
  }

  async function submitChange(
    requestType: "schedule_change" | "cancellation" | "item_change" | "alternative_interest",
    payload: Record<string, unknown>,
    reason: string,
  ) {
    if (!portal) return
    setError(null)
    setMessage(null)
    const fingerprint = JSON.stringify({
      reference_code: portal.reference_code,
      request_type: requestType,
      payload,
      reason,
      expected_revision: portal.revision,
    })
    let idempotencyKey = changeIdempotencyKeysRef.current.get(fingerprint)
    if (!idempotencyKey) {
      idempotencyKey = await createIdempotencyKey(fingerprint) ?? undefined
      if (!idempotencyKey) {
        setError("Permintaan sebelumnya belum dapat dipastikan. Kirim ulang perubahan yang sama atau tunggu hasil peninjauan sebelum mengubah usulan.")
        return
      }
      changeIdempotencyKeysRef.current.set(fingerprint, idempotencyKey)
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/akasha-smart-booking/portal/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({
          request_type: requestType,
          payload,
          reason,
          expected_revision: portal.revision,
          idempotency_key: idempotencyKey,
        }),
      })
      const body = await readJson(response)
      if (!response.ok) {
        if ([400, 401, 404, 409].includes(response.status)) {
          clearPendingChangeKey()
          changeIdempotencyKeysRef.current.delete(fingerprint)
        }
        throw new Error(typeof body.error === "string" ? body.error : "Permintaan perubahan belum dapat dikirim.")
      }
      clearPendingChangeKey()
      changeIdempotencyKeysRef.current.clear()
      await loadPortal()
      setMessage("Permintaan berhasil dikirim. Perubahan hanya berlaku setelah disetujui admin.")
      setManageDialog(null)
      setAlternativeDraft(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Permintaan perubahan gagal dikirim.")
    } finally {
      setSubmitting(false)
    }
  }

  async function requestScheduleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!schedulePickupDate || !scheduleReturnDate || scheduleReturnDate < schedulePickupDate) {
      setError("Tanggal pengembalian harus sama dengan atau setelah tanggal pengambilan.")
      return
    }
    const businessToday = new Date().toLocaleDateString("en-CA", {
      timeZone: portal?.business_timezone ?? "Asia/Jakarta",
    })
    if (!isValidSchedulePickupDate(
      schedulePickupDate,
      portal?.requested_pickup_date ?? null,
      businessToday,
    )) {
      setError("Tanggal pengambilan baru tidak dapat berada di masa lalu. Tanggal booking yang sudah ada boleh dipertahankan.")
      return
    }
    await submitChange(
      "schedule_change",
      { requested_pickup_date: schedulePickupDate, requested_return_date: scheduleReturnDate },
      "Customer mengajukan perubahan periode rental.",
    )
  }

  async function requestItemChange() {
    if (!portal) return
    const selected = Object.entries(draftQty)
      .filter(([, quantity]) => quantity > 0)
      .map(([key, quantity]) => ({ option: optionByKey.get(key), quantity }))
      .filter((entry): entry is { option: SmartBookingCatalogOption; quantity: number } => Boolean(entry.option))

    if (!draftHasChanges) return

    if (selected.length < 1 || selected.length > MAX_CHANGE_LINES) {
      setError("Permintaan perubahan harus berisi 1–10 jenis item.")
      return
    }

    const items = selected.map(({ option, quantity }) => ({
      kind: option.kind,
      ...toSmartBookingLine(option, quantity),
    }))
    await submitChange(
      "item_change",
      { items },
      "Customer mengajukan perubahan daftar barang atau kuantitas.",
    )
  }

  function alternativesForLine(line: PortalLine): SmartBookingCatalogOption[] {
    const currentKey = optionKeyFromPortalLine(line)
    const current = currentKey ? optionByKey.get(currentKey) : undefined
    if (!current || !current.barang_id || current.target_kind === "package") return []

    return options
      .filter((candidate) =>
        candidate.kind === current.kind
        && candidate.kategori_nama === current.kategori_nama
        && candidate.barang_id !== current.barang_id
      )
      .slice(0, 3)
  }

  function requestAlternative(line: PortalLine, option: SmartBookingCatalogOption) {
    setAlternativeDraft({ line, option })
  }

  async function confirmAlternativeRequest() {
    if (!alternativeDraft) return
    const { line, option } = alternativeDraft
    const quantity = Math.min(20, Math.max(1, Number(line.quantity) || 1))
    await submitChange(
      "alternative_interest",
      {
        source_line_id: line.line_id,
        items: [{ kind: option.kind, ...toSmartBookingLine(option, quantity) }],
      },
      "Customer tertarik pada alternatif " + option.barang_nama + ".",
    )
  }

  async function requestCancellation() {
    const confirmed = window.confirm("Kirim permintaan pembatalan untuk booking ini? Booking belum langsung dibatalkan.")
    if (!confirmed) return
    await submitChange("cancellation", {}, "Customer mengajukan pembatalan booking.")
  }

  async function logout() {
    setSubmitting(true)
    try {
      await fetch("/api/akasha-smart-booking/portal/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
      })
    } finally {
      setPortal(null)
      setAvailability(null)
      setDraftQty({})
      setActiveTab("overview")
      setManageDialog(null)
      setSubmitting(false)
      setMessage("Sesi portal sudah diakhiri.")
    }
  }

  function updateDraftQuantity(key: string, quantity: number) {
    const nextQuantity = Math.min(20, Math.max(0, Math.floor(Number.isFinite(quantity) ? quantity : 0)))
    setDraftQty((previous) => {
      const next = { ...previous }
      if (nextQuantity === 0) delete next[key]
      else next[key] = nextQuantity
      return next
    })
    setError(null)
  }

  function addDraftOption(optionKey: string) {
    const option = optionByKey.get(optionKey)
    if (!option) return
    if (!draftQty[option.key] && Object.keys(draftQty).length >= MAX_CHANGE_LINES) {
      setError("Maksimal 10 jenis item dalam satu perubahan.")
      return
    }
    updateDraftQuantity(option.key, Math.min(20, (draftQty[option.key] ?? 0) + 1))
  }

  function openScheduleDialog() {
    if (!portal) return
    // Keep the original pickup date independent from edits in the item dialog.
    // This lets customers extend only the return date (e.g. 11–12 to 11–14).
    setSchedulePickupDate(portal.requested_pickup_date ?? "")
    setScheduleReturnDate(portal.requested_return_date ?? "")
    setError(null)
    setManageDialog("schedule")
  }

  const closed = portal ? ["cancelled", "expired", "fulfilled"].includes(portal.workflow_status) : true
  const hasRental = portal?.lines.some((line) => line.kind === "rental") ?? false
  const hasPendingChange = portal?.change_requests.some((change) => change.status === "pending") ?? false
  const unresolvedLines = portal?.lines.filter((line) => {
    const key = optionKeyFromPortalLine(line)
    return !key || !optionByKey.has(key)
  }) ?? []
  const canEdit = !closed && !hasPendingChange
  const itemChangeOptions = hasRental
    ? options
    : options.filter((option) => option.kind === "sale")
  const catalogCategories = [
    "Semua",
    ...Array.from(new Set(itemChangeOptions.map((option) => option.kategori_nama))).sort((a, b) => a.localeCompare(b, "id")),
  ]
  const normalizedCatalogSearch = catalogSearch.trim().toLocaleLowerCase("id-ID")
  const filteredItemChangeOptions = itemChangeOptions.filter((option) => {
    const matchesCategory = catalogCategory === "Semua" || option.kategori_nama === catalogCategory
    const searchable = [option.barang_nama, option.varian_nama, option.kategori_nama, option.deskripsi]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("id-ID")
    return matchesCategory && (!normalizedCatalogSearch || searchable.includes(normalizedCatalogSearch))
  })
  const canEditItems = canEdit && itemChangeOptions.length > 0 && unresolvedLines.length === 0
  const hasAlternatives = portal?.lines.some((line) => alternativesForLine(line).length > 0) ?? false
  const draftOptions = Object.entries(draftQty)
    .map(([key, quantity]) => ({ option: optionByKey.get(key), quantity }))
    .filter((entry): entry is { option: SmartBookingCatalogOption; quantity: number } => Boolean(entry.option))
  const draftLinePeriods = (option: SmartBookingCatalogOption) => option.kind === "rental"
    ? calculateTariffPeriodsForDates(pickupDate, returnDate, option.priceDurationValue ?? 1, option.priceDurationUnit ?? "hari") ?? 1
    : 1
  const draftEstimate = draftOptions.reduce((sum, entry) => sum + calculateRentalEstimate(
    entry.quantity,
    entry.option.price,
    draftLinePeriods(entry.option),
  ), 0)
  const draftIncludesRental = draftOptions.some((entry) => entry.option.kind === "rental")
  const portalStayLabel = portal?.requested_pickup_date && portal.requested_return_date
    ? formatRentalStayLabel(portal.requested_pickup_date, portal.requested_return_date)
    : null
  const portalLineTariff = (line: PortalLine) => {
    if (line.kind !== "rental") return null
    return options.find((option) => option.kind === "rental" && (
      line.paket_sewa_id
        ? option.paket_sewa_id === line.paket_sewa_id
        : line.varian_barang_id
          ? option.varian_barang_id === line.varian_barang_id
          : option.target_kind === "product" && option.barang_id === line.barang_id
    )) ?? null
  }
  const portalLinePeriods = (
    line: PortalLine,
    pickup = portal?.requested_pickup_date ?? null,
    returned = portal?.requested_return_date ?? null,
  ) => {
    if (line.kind !== "rental") return 1
    const tariff = portalLineTariff(line)
    return calculateTariffPeriodsForDates(
      pickup,
      returned,
      tariff?.priceDurationValue ?? 1,
      tariff?.priceDurationUnit ?? "hari",
    ) ?? 1
  }
  const portalLineEstimate = (line: PortalLine) => calculateRentalEstimate(
    line.quantity,
    line.unit_price,
    portalLinePeriods(line),
  )
  const portalEstimate = portal?.lines.reduce((sum, line) => sum + portalLineEstimate(line), 0) ?? 0
  // quote_total aggregates saved line snapshots and does not expand rentals by
  // the active date range. Use the same period-aware total as the Detail tab.
  const bookingTotal = Math.max(
    0,
    portal?.lines.length
      ? (Number.isFinite(portalEstimate) ? portalEstimate : 0)
      : (Number(portal?.quote_total ?? 0) || 0),
  )
  const dpAmount = portal?.dp_amount === null || portal?.dp_amount === undefined
    ? null
    : Math.max(0, Number(portal.dp_amount) || 0)
  const dpPercent = dpAmount !== null && bookingTotal > 0
    ? Math.min(100, Math.max(0, (dpAmount / bookingTotal) * 100))
    : 0
  const remainingEstimate = dpAmount === null ? null : Math.max(0, bookingTotal - dpAmount)
  const adminHistoryNotices = [
    ...(portal?.timeline ?? [])
      .filter((event) => ["booking.status.ready_for_checkout", "booking.status.cancelled"].includes(event.type))
      .map((event) => ({
        id: event.type + ":" + event.occurred_at,
        title: event.type === "booking.status.ready_for_checkout" ? "Konfirmasi booking" : "Pembatalan booking",
        message: event.message ?? (event.type === "booking.status.ready_for_checkout"
          ? "Booking Anda telah dikonfirmasi."
          : "Booking Anda telah dibatalkan oleh admin."),
        occurred_at: event.occurred_at,
      })),
    ...(portal?.change_requests ?? [])
      .filter((change) => change.status === "applied" || change.status === "approved" || change.status === "rejected")
      .map((change) => {
        const eventType = change.status === "applied" ? "booking.change.applied" : change.status === "rejected" ? "booking.change.rejected" : "booking.change.approved"
        const event = (portal?.timeline ?? []).find((entry) =>
          entry.type === eventType && entry.occurred_at === change.resolved_at
        )
        return {
          id: change.id,
          title: requestTypeLabel(change.type) + " · " + requestStatusLabel(change.status),
          message: change.public_resolution_note ?? event?.message ?? (
            change.status === "applied"
              ? "Permintaan Anda telah diterapkan oleh admin."
              : change.status === "approved"
                ? "Permintaan Anda telah disetujui oleh admin."
                : "Permintaan Anda belum dapat disetujui oleh admin."
          ),
          occurred_at: change.resolved_at ?? change.created_at,
        }
      }),
  ].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
  const historyTimeline = (portal?.timeline ?? []).filter((event) =>
    !["booking.status.ready_for_checkout", "booking.status.cancelled", "booking.change.applied", "booking.change.approved", "booking.change.rejected"].includes(event.type)
  )
  const scheduleDatesValid = Boolean(
    schedulePickupDate
    && scheduleReturnDate
    && scheduleReturnDate >= schedulePickupDate,
  )
  const businessToday = new Date().toLocaleDateString("en-CA", {
    timeZone: portal?.business_timezone ?? "Asia/Jakarta",
  })
  const minimumSchedulePickupDate = getMinimumSchedulePickupDate(
    portal?.requested_pickup_date ?? null,
    businessToday,
  )
  const currentScheduleEstimate = portalEstimate
  const proposedScheduleEstimate = scheduleDatesValid
    ? portal?.lines.reduce((sum, line) => {
      return sum + calculateRentalEstimate(
        line.quantity,
        line.unit_price,
        portalLinePeriods(line, schedulePickupDate, scheduleReturnDate),
      )
    }, 0) ?? 0
    : 0
  const scheduleEstimateDelta = proposedScheduleEstimate - currentScheduleEstimate


  const portalReceipt = useMemo<BookingReceipt | null>(() => {
    if (!portal) return null
    return {
      reference_code: portal.reference_code,
      access_code: null,
      portal_link_url: null,
      credential_requires_rotation: false,
      workflow_status: portal.workflow_status,
      total_estimate: portalEstimate,
      currency_code: portal.currency_code,
      customer_name: portal.customer_name,
      // The authenticated portal projection intentionally does not expose phone
      // or reusable access credentials. The shared receipt renderer omits blank phone.
      customer_phone: "",
      pickup_date: portal.requested_pickup_date,
      return_date: portal.requested_return_date,
      stay_duration_label: portalStayLabel,
      created_at: portal.created_at,
      lines: portal.lines.map((line) => {
        const optionKey = optionKeyFromPortalLine(line)
        const option = optionKey ? optionByKey.get(optionKey) : undefined
        return {
          id: line.line_id,
          kind: line.kind,
          name: line.name,
          category: option?.kategori_nama ?? "",
          variant: line.variant,
          quantity: line.quantity,
          price: line.unit_price,
          normalPrice: line.normal_price,
          discountPercent: line.discount_percent,
          durationValue: option?.priceDurationValue ?? null,
          durationUnit: option?.priceDurationUnit ?? null,
        }
      }),
    }
  }, [portal, portalEstimate, portalStayLabel, optionByKey])

  useEffect(() => {
    let active = true
    if (!portalReceipt) return
    void createBookingReceiptQr(window.location.origin + "/booking/portal")
      .then((value) => { if (active) setReceiptQrDataUrl(value) })
      .catch(() => { if (active) setReceiptQrDataUrl(null) })
    return () => { active = false }
  }, [portalReceipt])

  async function downloadPortalReceipt(kind: "png" | "pdf") {
    if (!portalReceipt || !receiptQrDataUrl || receiptExporting) return
    setReceiptExporting(kind)
    setError(null)
    try {
      const filename = "AKASHA-BOOKING-" + portalReceipt.reference_code.replace(/[^a-z0-9-]/gi, "-")
      await exportBookingReceipt(portalReceipt, receiptQrDataUrl, kind, filename)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Bukti booking belum dapat diunduh.")
    } finally {
      setReceiptExporting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        <LoaderCircle className="mr-2 size-4 animate-spin" /> Memeriksa sesi portal...
      </div>
    )
  }

  if (!portal) {
    return (
      <section className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Cek booking Anda</h1>
          <p className="mt-2 text-xs text-muted-foreground">Masukkan kode akses atau buka tautan pribadi.</p>
          <form onSubmit={login} className="mt-5 space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Kode akses</span>
              <input autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 40).toUpperCase())} maxLength={40} required className="h-11 w-full rounded-xl border border-border bg-background px-3 uppercase tracking-[0.18em]" placeholder="Contoh: ABCD2345" />
              <span className="block text-xs text-muted-foreground">Kode akses ada pada bukti booking Anda.</span>
            </label>
            {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {message && <p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</p>}
            <button type="submit" disabled={submitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Masuk ke portal
            </button>
          </form>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Jaga kerahasiaan kode dan tautan pribadi Anda.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <header className="relative isolate overflow-hidden rounded-2xl border border-border/70 bg-white px-4 py-4 shadow-sm dark:bg-[#111111] sm:px-5 sm:py-5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 -z-10 size-56 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              <ShieldCheck className="size-3.5" /> Akasha Outdoor
            </p>
            <h1 className="mt-1.5 truncate text-xl font-semibold tracking-tight sm:text-2xl">Halo, {portal.customer_name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>Booking</span>
              <span className="font-semibold tracking-wide text-foreground">{portal.reference_code}</span>
              <button type="button" onClick={() => void copyBookingCode()} aria-label="Salin kode reservasi" className="grid size-7 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-primary">
                <Clipboard className="size-3.5" />
              </button>
            </div>
          </div>
          <button type="button" onClick={() => void logout()} disabled={submitting} aria-label="Keluar dari portal" className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-primary disabled:opacity-50">
            <LogOut className="size-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> {statusLabel(portal.workflow_status)}
          </span>
          {hasPendingChange ? <span className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">Perubahan ditinjau</span> : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-muted/55 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground">Pengambilan</p>
            <p className="mt-1 text-xs font-semibold">{formatPortalDate(portal.requested_pickup_date)}</p>
          </div>
          <div className="rounded-xl bg-muted/55 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground">Pengembalian</p>
            <p className="mt-1 text-xs font-semibold">{formatPortalDate(portal.requested_return_date)}</p>
          </div>
          <div className="rounded-xl bg-muted/55 px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground">Barang</p>
            <p className="mt-1 text-xs font-semibold">{portal.lines.length} jenis · {portal.lines.reduce((sum, line) => sum + line.quantity, 0)} unit</p>
          </div>
        </div>

        <section aria-label="Informasi DP booking" className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.055] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Down Payment (DP)</p>
              {dpAmount === null ? (
                <p className="mt-1 text-sm font-semibold">Belum dicatat</p>
              ) : dpAmount === 0 ? (
                <p className="mt-1 text-sm font-semibold">Tanpa DP</p>
              ) : (
                <>
                  <p className="mt-1 text-lg font-bold leading-tight tabular-nums">{formatRupiah(dpAmount)}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-primary">{new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(dpPercent)}% dari total booking</p>
                </>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-muted-foreground">Total booking</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{formatRupiah(bookingTotal)}</p>
            </div>
          </div>
          {dpAmount !== null && dpAmount > 0 && bookingTotal > 0 ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/15" role="progressbar" aria-label="Persentase DP" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(dpPercent)}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: dpPercent + "%" }} />
            </div>
          ) : null}
          {remainingEstimate !== null ? (
            <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-primary/15 pt-2.5">
              <span className="text-[11px] text-muted-foreground">Sisa estimasi</span>
              <strong className="text-sm tabular-nums">{formatRupiah(remainingEstimate)}</strong>
            </div>
          ) : null}
        </section>
        {portalStayLabel ? <p className="mt-2 text-[10px] text-muted-foreground">Durasi {portalStayLabel}</p> : null}
      </header>

      <nav aria-label="Navigasi portal booking" className="sticky top-16 z-30 -mx-1 rounded-2xl border border-border/70 bg-background/95 p-1.5 shadow-sm backdrop-blur-xl">
        <div role="tablist" aria-label="Bagian portal customer" className="grid grid-cols-6 gap-1.5 md:flex md:min-w-0 md:gap-1">
          {([
            { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
            { id: "detail", label: "Detail", icon: FileText },
            { id: "tracking", label: portal.transaction_tracking ? "Tracking" : "Ketersediaan", icon: Activity },
            { id: "manage", label: "Kelola", icon: SlidersHorizontal },
            { id: "history", label: "Riwayat", icon: History },
          ] as const).map((tab, index) => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            const mobilePosition = index < 3 ? "col-span-2" : index === 3 ? "col-span-2 col-start-2" : "col-span-2 col-start-4"
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={"portal-tab-" + tab.id}
                aria-selected={selected}
                aria-controls="portal-tab-panel"
                onClick={() => { setActiveTab(tab.id); setManageDialog(null) }}
                disabled={submitting}
                className={mobilePosition + " inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-semibold leading-tight transition md:h-10 md:min-h-0 md:flex-1 md:flex-row md:gap-2 md:px-3.5 md:py-0 md:text-xs " + (selected ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}
              >
                <Icon className="size-4 shrink-0 md:size-3.5" />
                <span className="text-center">{tab.label}</span>
                {tab.id === "manage" && hasPendingChange ? <span className={"size-1.5 rounded-full " + (selected ? "bg-primary-foreground" : "bg-primary")} /> : null}
              </button>
            )
          })}
        </div>
      </nav>

      {error ? <p role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p> : null}
      {message ? <p role="status" className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-sm text-primary"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{message}</p> : null}
      {hasPendingChange && !closed ? (
        <p className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-3 text-xs text-primary">
          Perubahan sedang ditinjau.
        </p>
      ) : null}

      <div id="portal-tab-panel" role="tabpanel" aria-labelledby={"portal-tab-" + activeTab} className="min-w-0">
        {activeTab === "overview" ? (
          <div className="space-y-3">
            {!closed && canEdit ? (
              <button type="button" onClick={() => setActiveTab("manage")} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/[0.055] px-3.5 py-3 text-left">
                <span>
                  <span className="block text-xs font-semibold">Ubah barang atau jadwal</span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">Kelola booking Anda</span>
                </span>
                <SlidersHorizontal className="size-4 shrink-0 text-primary" />
              </button>
            ) : null}

            <section className="rounded-2xl border border-border/70 bg-card p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Pilihan barang</h2>
                <button type="button" onClick={() => setActiveTab("detail")} className="text-[11px] font-semibold text-primary">Lihat semua</button>
              </div>
              <div className="divide-y divide-border/60">
                {portal.lines.slice(0, 3).map((line) => (
                  <div key={line.line_id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{line.name}{line.variant ? " · " + line.variant : ""}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{line.kind === "rental" ? "Sewa" : "Beli"} · {line.quantity} unit</p>
                    </div>
                    <strong className="shrink-0 text-xs tabular-nums">{formatRupiah(portalLineEstimate(line))}</strong>
                  </div>
                ))}
              </div>
              {portal.lines.length > 3 ? <p className="mt-2 text-[10px] text-muted-foreground">+{portal.lines.length - 3} jenis lainnya</p> : null}
              <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
                <span className="text-[11px] text-muted-foreground">Estimasi total</span>
                <strong className="text-sm text-primary">{formatRupiah(portalEstimate)}</strong>
              </div>
            </section>

            <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-card p-3.5">
              <div>
                <p className="text-xs font-semibold">Bukti booking</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Simpan sebagai gambar atau PDF</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[224px]">
                <button type="button" onClick={() => void downloadPortalReceipt("png")} disabled={!receiptQrDataUrl || receiptExporting !== null} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-semibold disabled:opacity-50">
                  <Download className="size-3.5" /> {receiptExporting === "png" ? "Menyiapkan..." : "Unduh PNG"}
                </button>
                <button type="button" onClick={() => void downloadPortalReceipt("pdf")} disabled={!receiptQrDataUrl || receiptExporting !== null} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-semibold text-primary-foreground disabled:opacity-50">
                  <Download className="size-3.5" /> {receiptExporting === "pdf" ? "Menyiapkan..." : "Unduh PDF"}
                </button>
              </div>
            </section>

            {historyTimeline.length > 0 ? (
              <section className="rounded-2xl border border-border/70 bg-card p-3.5">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <h2 className="text-xs font-semibold">Pembaruan terbaru</h2>
                  <button type="button" onClick={() => setActiveTab("history")} className="text-[10px] font-semibold text-primary">Riwayat</button>
                </div>
                <ol className="space-y-2.5">
                  {historyTimeline.slice(0, 2).map((event, index) => (
                    <li key={index} className="flex gap-2.5">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-[11px] leading-4">{event.message ?? statusLabel(event.type)}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(event.occurred_at).toLocaleDateString("id-ID", { timeZone: portal.business_timezone || "Asia/Jakarta" })}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
        ) : null}

              {activeTab === "tracking" && portal.transaction_tracking ? (
        <section className="rounded-2xl border border-primary/20 bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">Perjalanan pesanan</p>
              <h2 className="mt-1 text-base font-semibold">Pesanan diproses</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Mulai diproses {formatPortalDateTime(portal.transaction_tracking.converted_at, portal.business_timezone)}.
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
              Diproses
            </span>
          </div>

          {portal.transaction_tracking.rental ? (
            <div className="mt-4 rounded-2xl border border-border/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Penyewaan</p>
                  <p className="mt-1 text-sm font-bold">{portal.transaction_tracking.rental.rental_number}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
                  {rentalTrackingLabel(
                    portal.transaction_tracking.rental.status,
                    portal.transaction_tracking.rental.actual_pickup_at,
                    portal.transaction_tracking.rental.actual_return_completed_at,
                    portal.transaction_tracking.rental.actual_return_started_at,
                  )}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[10px] text-muted-foreground">Jadwal pengambilan aktual</p>
                  <p className="mt-1 text-xs font-semibold">
                    {formatPortalDateTime(portal.transaction_tracking.rental.scheduled_pickup_at, portal.business_timezone)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-[10px] text-muted-foreground">Jadwal pengembalian aktual</p>
                  <p className="mt-1 text-xs font-semibold">
                    {formatPortalDateTime(portal.transaction_tracking.rental.scheduled_return_at, portal.business_timezone)}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                {portal.transaction_tracking.rental.actual_pickup_at ? (
                  <p>Diserahkan {formatPortalDateTime(portal.transaction_tracking.rental.actual_pickup_at, portal.business_timezone)}.</p>
                ) : null}
                {portal.transaction_tracking.rental.actual_return_started_at ? (
                  <p>Proses pengembalian dimulai {formatPortalDateTime(portal.transaction_tracking.rental.actual_return_started_at, portal.business_timezone)}.</p>
                ) : null}
                {portal.transaction_tracking.rental.actual_return_completed_at ? (
                  <p className="font-medium text-primary">
                    Pengembalian selesai {formatPortalDateTime(portal.transaction_tracking.rental.actual_return_completed_at, portal.business_timezone)}.
                  </p>
                ) : portal.transaction_tracking.rental.tolerance_deadline ? (
                  <p>Batas toleransi pengembalian {formatPortalDateTime(portal.transaction_tracking.rental.tolerance_deadline, portal.business_timezone)}.</p>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {portal.transaction_tracking.rental.lines.map((line, index) => (
                  <div key={index} className="flex flex-col gap-1 rounded-xl border border-border/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{line.name}{line.variant ? " · " + line.variant : ""}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Jumlah {line.quantity} unit</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {line.assigned_unit_count > 0 ? (
                        <span className="text-[10px] text-muted-foreground">{line.assigned_unit_count} unit disiapkan</span>
                      ) : null}
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold">
                        {rentalProgressLabel(line.progress_status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <span className="text-[11px] text-muted-foreground">Total penyewaan</span>
                <strong className="text-sm">{formatRupiah(portal.transaction_tracking.rental.total_amount)}</strong>
              </div>
              <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                Status diperbarui di portal ini.
              </p>
            </div>
          ) : null}

          {portal.transaction_tracking.sale ? (
            <div className="mt-3 rounded-2xl border border-border/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pembelian</p>
                  <p className="mt-1 text-sm font-bold">{portal.transaction_tracking.sale.sale_number}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
                  {saleTrackingLabel(portal.transaction_tracking.sale.status)}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {portal.transaction_tracking.sale.lines.map((line, index) => (
                  <div key={index} className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-3">
                    <div>
                      <p className="text-xs font-medium">{line.name}{line.variant ? " · " + line.variant : ""}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {line.quantity} unit{line.is_bonus ? " · bonus rental" : ""}
                      </p>
                    </div>
                    <p className="text-xs font-semibold">{formatRupiah(line.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <span className="text-[11px] text-muted-foreground">
                  Pembayaran {portal.transaction_tracking.sale.payment_status === "paid" ? "lunas" : "belum lunas"}
                </span>
                <strong className="text-sm">{formatRupiah(portal.transaction_tracking.sale.total_amount)}</strong>
              </div>
            </div>
          ) : null}

          <p className="mt-3 text-[10px] leading-5 text-muted-foreground">
            Status pesanan diperbarui di portal.
          </p>
        </section>
      ) : null}
        {activeTab === "detail" && (
      <section className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Rincian booking</h2>
          <button
            type="button"
            onClick={() => {
              void loadPortal().then((latestPortal) => {
                if (latestPortal.transaction_tracking) setAvailability(null)
                else return loadAvailability()
              }).catch((cause) => setError(cause instanceof Error ? cause.message : "Gagal memuat ulang."))
            }}
            disabled={submitting || draftHasChanges}
            title={draftHasChanges ? "Kirim atau batalkan perubahan sebelum memperbarui data." : "Perbarui status booking"}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold disabled:opacity-50"
          >
            <RefreshCw className="size-3.5" /> Perbarui
          </button>
        </div>
        <div className="mt-4 divide-y divide-border/60">
          {portal.lines.map((line) => (
            <div key={line.line_id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{line.name}{line.variant ? " · " + line.variant : ""}</p>
                <p className="mt-1 text-xs text-muted-foreground">{line.kind === "rental" ? "Rental · " + (portalStayLabel ?? "periode belum ditentukan") + " · " + portalLinePeriods(line) + " periode" : "Pembelian · sekali beli"} · {line.quantity} unit</p>
                {line.kind === "rental" ? <p className="mt-1 text-[10px] text-muted-foreground">{line.quantity} unit × {portalLinePeriods(line)} periode × {formatRupiah(line.unit_price)}</p> : null}
                {line.discount_percent > 0 && <p className="mt-1 text-xs text-primary">Promo {line.discount_percent}% · hemat {formatRupiah(line.discount_amount * portalLinePeriods(line))}</p>}
              </div>
              <div className="shrink-0 text-right">
                {line.discount_percent > 0 && <p className="text-xs text-muted-foreground line-through">{formatRupiah(line.normal_price * line.quantity * portalLinePeriods(line))}</p>}
                <p className="text-sm font-semibold">{formatRupiah(portalLineEstimate(line))}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.045] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">Total harga booking</span>
            <strong className="text-base font-bold tabular-nums text-primary">{formatRupiah(bookingTotal)}</strong>
          </div>
          {dpAmount !== null ? (
            <div className="mt-2 space-y-1.5 border-t border-primary/15 pt-2 text-xs">
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span>DP tercatat</span>
                <strong className="font-semibold text-foreground">{formatRupiah(dpAmount)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Sisa estimasi setelah DP</span>
                <strong className="font-semibold tabular-nums">{formatRupiah(remainingEstimate ?? bookingTotal)}</strong>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">Nominal DP belum tercatat pada booking ini.</p>
          )}
        </div>
      </section>
      )}

        {activeTab === "manage" ? (
          <div className="space-y-3">
            {!closed ? (
              <aside aria-label="Ketentuan perubahan booking" className="rounded-2xl border border-primary/35 bg-primary/[0.075] p-3.5 sm:p-4">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><ShieldCheck className="size-4" /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Perubahan booking perlu persetujuan admin</p>
                    <p className="mt-1.5 text-xs leading-5 text-foreground/90">
                      Setiap pengajuan perubahan barang, jumlah, atau jadwal belum langsung mengubah booking Anda. Admin akan meninjau sesuai kebijakan dan ketersediaan operasional. Perubahan berlaku setelah disetujui.
                    </p>
                  </div>
                </div>
              </aside>
            ) : null}
            {!closed && !hasPendingChange && hasAlternatives && (
        <section className="rounded-2xl border border-border/70 bg-card p-4">
          <h2 className="text-base font-semibold">Alternatif sejenis</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Ajukan alternatif barang untuk ditinjau admin.
          </p>
          <div className="mt-3 space-y-3">
            {portal.lines.map((line) => {
              const alternatives = alternativesForLine(line)
              if (alternatives.length === 0) return null
              return (
                <div key={line.line_id} className="rounded-2xl border border-border/60 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Alternatif untuk {line.name}{line.variant ? " · " + line.variant : ""}</p>
                  <div className="mt-2 space-y-2">
                    {alternatives.map((option) => (
                      <div key={option.key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{option.barang_nama}{option.varian_nama ? " · " + option.varian_nama : ""}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatRupiah(option.price)}{option.priceDurationValue && option.priceDurationUnit ? " / " + option.priceDurationValue + " " + option.priceDurationUnit : ""}</p>
                        </div>
                        <button type="button" onClick={() => void requestAlternative(line, option)} disabled={submitting} className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-primary/30 px-3 text-xs font-semibold text-primary disabled:opacity-50">
                          Ajukan pilihan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
                  {canEdit && unresolvedLines.length > 0 && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-2.5 text-xs text-amber-800 dark:text-amber-200">
          Sebagian barang perlu bantuan admin.
        </p>
      )}
            {hasPendingChange ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-3">
                <p className="text-xs font-semibold text-primary">Permintaan sedang ditinjau.</p>
              </div>
            ) : !canEdit ? (
              <div className="rounded-2xl border border-border/70 bg-card p-3"><p className="text-xs font-semibold">Booking tidak dapat diubah kembali.</p></div>
            ) : (
              <div className="space-y-2">
                <article className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.035] p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Package className="size-4.5" /></div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-semibold">Ubah atau tambah barang</h2>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Atur barang dan jumlah.</p>
                  </div>
                  <button type="button" onClick={openItemsDialog} disabled={!canEditItems} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-semibold text-primary-foreground disabled:opacity-45">
                    Atur <Package className="size-3.5" />
                  </button>
                </article>
                {hasRental ? (
                  <article className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.035] p-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays className="size-4.5" /></div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xs font-semibold">Ubah jadwal sewa</h2>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Pilih tanggal baru.</p>
                    </div>
                    <button type="button" onClick={openScheduleDialog} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-semibold text-primary-foreground">
                      Atur <CalendarDays className="size-3.5" />
                    </button>
                  </article>
                ) : null}
                <article className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-card p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive"><CircleAlert className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-semibold">Pembatalan booking</h2>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Ajukan pembatalan.</p>
                  </div>
                  <button type="button" onClick={() => void requestCancellation()} disabled={submitting} className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-destructive/30 px-3 text-[11px] font-semibold text-destructive disabled:opacity-50">
                    Ajukan
                  </button>
                </article>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "history" && (
          <section className="rounded-2xl border border-border/70 bg-card p-4">
            <h2 className="text-sm font-semibold">Riwayat booking</h2>

            {adminHistoryNotices.length > 0 ? (
              <section aria-label="Pesan dari admin" className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.045] p-3.5">
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <ShieldCheck className="size-4" />
                  <h3 className="text-xs font-semibold">Pesan dari admin</h3>
                </div>
                <div className="space-y-3">
                  {adminHistoryNotices.map((notice) => (
                    <article key={notice.id} className="border-t border-primary/15 pt-2.5 first:border-0 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold">{notice.title}</p>
                        <time className="text-[10px] text-muted-foreground">
                          {new Date(notice.occurred_at).toLocaleString("id-ID", { timeZone: portal.business_timezone || "Asia/Jakarta" })}
                        </time>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-foreground/85">{notice.message}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {portal.change_requests.length > 0 ? (
              <div className="mt-3 space-y-2">
                {portal.change_requests.map((change) => (
                  <div key={change.id} className="rounded-xl bg-muted/45 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <strong>{requestTypeLabel(change.type)}</strong>
                      <span className="text-muted-foreground">{requestStatusLabel(change.status)}</span>
                    </div>
                    {change.reason ? <p className="mt-1 text-muted-foreground">{change.reason}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 border-t border-border/60 pt-3">
              <h3 className="text-xs font-semibold">Aktivitas booking</h3>
              {historyTimeline.length > 0 ? (
                <ol className="mt-3 space-y-3 border-l border-border pl-4">
                  {historyTimeline.map((event, index) => (
                    <li key={index} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
                      <p className="text-xs leading-5">{event.message ?? statusLabel(event.type)}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(event.occurred_at).toLocaleString("id-ID", { timeZone: portal.business_timezone || "Asia/Jakarta" })}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">Belum ada aktivitas lainnya.</p>
              )}
            </div>
          </section>
        )}
              {activeTab === "tracking" && !portal.transaction_tracking && (
      <section className="rounded-2xl border border-border/70 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Ketersediaan saat ini</h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {availability?.checked_at ? "Diperiksa " + new Date(availability.checked_at).toLocaleString("id-ID") : "Belum diperiksa"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAvailability().then(() => setAvailabilityRefreshError(null)).catch((cause) => setAvailabilityRefreshError(cause instanceof Error ? cause.message : "Ketersediaan belum dapat dimuat."))}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-xs font-semibold"
          >
            <RefreshCw className="size-3.5" /> Perbarui stok
          </button>
        </div>
        {!availability ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">Stok belum tersedia. Perbarui untuk mencoba lagi.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.045] p-2.5 text-[11px] text-muted-foreground">
              Stok dapat berubah sebelum checkout.
            </div>
            {availabilityRefreshError ? (
              <p role="status" className="text-[11px] leading-5 text-amber-700 dark:text-amber-300">
                {availabilityRefreshError}
              </p>
            ) : null}
            {availabilityIsStale ? (
              <p role="status" className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-2.5 text-[11px] text-amber-800 dark:text-amber-200">
                Data stok perlu diperbarui.
              </p>
            ) : null}
            {availability.lines.some((line) => isAvailabilityShortage(line.status)) ? (
              <p className="rounded-xl border border-destructive/25 bg-destructive/[0.04] p-2.5 text-xs leading-5 text-destructive">
                Sebagian barang berpotensi tidak mencukupi.
              </p>
            ) : availability.lines.some((line) => isAvailabilityConditional(line.status)) ? (
              <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-2.5 text-xs leading-5 text-amber-800 dark:text-amber-200">
                Sebagian stok bergantung pada pengembalian atau varian lain.
              </p>
            ) : null}
            <div className="mt-3 divide-y divide-border/60">
              {availability.lines.map((line, index) => (
                <div key={index} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{line.item_name}{line.variant_name ? " · " + line.variant_name : ""}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{line.kind === "rental" ? "Rental" : "Pembelian"} · Diminta {line.requested_quantity}</p>
                    </div>
                    <span className="text-right text-xs font-semibold text-primary">{availabilityLabel(line.status)}</span>
                  </div>
                  {line.components?.map((component, componentIndex) => {
                    const projection = component.availability
                    if (!projection) return null
                    const ready = projection.ready_now_requested_variant
                      ?? projection.ready_now_across_variants
                      ?? projection.available_now_requested_variant
                      ?? projection.available_now_across_variants
                    const potential = projection.potential_returns_before_pickup_requested_variant
                      ?? projection.potential_returns_before_pickup_across_variants
                    return (
                      <div key={componentIndex} className="mt-2 rounded-xl bg-muted/45 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {component.component_name ?? line.item_name}{component.requested_variant ? " · " + component.requested_variant : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 leading-5">
                          <span>Siap sekarang: <strong className="text-foreground">{ready ?? "Belum dapat dipastikan"}</strong></span>
                          <span>Potensi kembali: <strong className="text-foreground">{potential ?? "Belum dapat dipastikan"}</strong></span>
                          {projection.status ? <span className="basis-full">Keterangan: <strong className="text-foreground">{availabilityLabel(projection.status)}</strong></span> : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Stok final diperiksa saat checkout.</p>
          </>
        )}
      </section>
      )}
      </div>

      {activeTab === "manage" && manageDialog === "items" && canEditItems ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setManageDialog(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="portal-items-dialog-title" className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[1.5rem] border border-border/70 bg-card p-3 shadow-2xl sm:rounded-[1.5rem] sm:p-4">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Kelola booking</p><h2 id="portal-items-dialog-title" className="mt-1 text-lg font-semibold">Atur barang booking</h2></div><button type="button" onClick={() => setManageDialog(null)} disabled={submitting} aria-label="Tutup pengaturan barang" className="grid size-9 place-items-center rounded-full border border-border"><X className="size-4" /></button></div>

            <div className="space-y-3">
              <p className="text-xs leading-5 text-muted-foreground">Atur pilihan dan jumlah barang, lalu kirim usulan.</p>
              <aside className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/[0.07] p-3" aria-label="Informasi persetujuan perubahan barang">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-foreground/90">Penambahan atau perubahan barang masih berupa pengajuan. Admin akan memeriksa ketersediaan dan kebijakan operasional; booking baru diperbarui setelah disetujui.</p>
              </aside>
              {!hasRental ? <p className="rounded-xl bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">Hanya untuk pembelian. Buat booking baru untuk sewa.</p> : null}
              <section className="rounded-2xl border border-primary/25 bg-primary/[0.045] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Barang booking</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {draftOptions.length} jenis · {draftOptions.reduce((sum, entry) => sum + entry.quantity, 0)} unit dalam usulan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogOpen(true)
                      setError(null)
                    }}
                    disabled={submitting}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    <Plus className="size-3.5" /> Tambah / ubah barang
                  </button>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                  Katalog dibuka terpisah agar ringkasan barang, estimasi, dan tombol pengajuan tetap ringkas dalam satu halaman.
                </p>
              </section>
              <div>
                <p className="mb-2 text-xs font-semibold">Barang dalam usulan</p>
                {draftOptions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">Belum ada item dalam usulan perubahan.</p>
              ) : (
                <div className="max-h-52 divide-y divide-border/60 overflow-y-auto overscroll-contain rounded-2xl border border-border/70">
                  {draftOptions.map(({ option, quantity }) => (
                    <div key={option.key} className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted/60 text-primary/55">
                          {option.imageUrl ? (
                            <Image src={option.imageUrl} alt="" fill unoptimized sizes="44px" className="object-contain p-1" />
                          ) : (
                            option.kind === "rental" ? <Tent className="size-5" /> : <ShoppingBag className="size-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-primary">{option.kind === "rental" ? "Sewa" : "Beli"}</p>
                          <p className="line-clamp-2 text-xs font-semibold leading-4">{option.barang_nama}{option.varian_nama ? " · " + option.varian_nama : ""}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatRupiah(option.price)}{option.kind === "rental" ? " / periode · " + draftLinePeriods(option) + " periode" : " / unit"}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => updateDraftQuantity(option.key, quantity - 1)} disabled={submitting || quantity <= 1} aria-label="Kurangi jumlah" className="grid size-8 place-items-center rounded-full border border-border disabled:opacity-40">−</button>
                        <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                        <button type="button" onClick={() => updateDraftQuantity(option.key, quantity + 1)} disabled={submitting || quantity >= 20} aria-label="Tambah jumlah" className="grid size-8 place-items-center rounded-full border border-border disabled:opacity-40">+</button>
                        <button type="button" onClick={() => updateDraftQuantity(option.key, 0)} disabled={submitting} aria-label="Hapus item dari usulan" className="grid size-8 place-items-center rounded-full border border-border text-destructive disabled:opacity-40"><Trash2 className="size-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Estimasi booking saat ini</span>
                  <strong className="tabular-nums">{formatRupiah(portalEstimate)}</strong>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Estimasi usulan baru</span>
                  <strong className="tabular-nums text-primary">{formatRupiah(draftEstimate)}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-primary/15 pt-2 text-xs">
                  <span className="font-semibold text-foreground">
                    {draftEstimate - portalEstimate > 0
                      ? "Perkiraan tambahan biaya"
                      : draftEstimate - portalEstimate < 0
                        ? "Potensi pengurangan biaya"
                        : "Selisih estimasi"}
                  </span>
                  <strong className="tabular-nums text-primary">
                    {draftEstimate - portalEstimate > 0 ? "+ " : draftEstimate - portalEstimate < 0 ? "− " : ""}
                    {formatRupiah(Math.abs(draftEstimate - portalEstimate))}
                  </strong>
                </div>
                {draftIncludesRental ? <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Durasi {formatRentalStayLabel(pickupDate, returnDate) ?? "belum valid"} · {formatPortalDate(pickupDate)} – {formatPortalDate(returnDate)}. Tarif rental dikalikan otomatis sesuai jumlah periode.</p> : null}
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">Nilai ini merupakan estimasi sebelum pemeriksaan tarif, ketersediaan, dan persetujuan admin.</p>
              </div>
              <div className="sticky bottom-0 -mx-3 flex flex-col gap-2 border-t border-border/70 bg-card/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-4 sm:px-4">
                <div className="flex items-center justify-between gap-3 text-[10px]">
                  <span className="text-muted-foreground">
                    {draftHasChanges ? "Ada perubahan pada usulan." : "Belum ada perubahan dari booking saat ini."}
                  </span>
                  <strong className="tabular-nums">{draftOptions.length}/{MAX_CHANGE_LINES} jenis</strong>
                </div>
                <button type="button" onClick={() => void requestItemChange()} disabled={submitting || !draftHasChanges || draftOptions.length === 0} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
                  {submitting ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                  {draftHasChanges ? "Kirim usulan perubahan" : "Tidak ada perubahan"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "manage" && manageDialog === "items" && catalogOpen && canEditItems ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setCatalogOpen(false)
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-item-catalog-title"
            className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.5rem] border border-border/70 bg-card shadow-2xl sm:rounded-[1.5rem]"
          >
            <header className="shrink-0 border-b border-border/70 px-3 py-3 sm:px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Katalog Akasha</p>
                  <h2 id="portal-item-catalog-title" className="mt-0.5 text-base font-semibold">Tambah atau ubah barang</h2>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Pilih barang, sesuaikan jumlah, lalu kembali ke ringkasan usulan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCatalogOpen(false)}
                  disabled={submitting}
                  aria-label="Kembali ke ringkasan barang"
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-border"
                >
                  <X className="size-4" />
                </button>
              </div>
              <label className="relative mt-3 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Cari barang, varian, atau kategori…"
                  aria-label="Cari barang di katalog"
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs outline-none transition focus:border-primary"
                />
              </label>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                {catalogCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCatalogCategory(category)}
                    aria-pressed={catalogCategory === category}
                    className={catalogCategory === category
                      ? "shrink-0 rounded-full border border-primary bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground"
                      : "shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold text-muted-foreground"}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
              {filteredItemChangeOptions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-3 py-10 text-center">
                  <Package className="mx-auto size-6 text-muted-foreground/60" />
                  <p className="mt-2 text-xs font-semibold">Barang tidak ditemukan</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Coba kata kunci atau kategori lainnya.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {filteredItemChangeOptions.map((option) => {
                    const quantity = draftQty[option.key] ?? 0
                    const periods = draftLinePeriods(option)
                    const estimatedPerUnit = calculateRentalEstimate(1, option.price, periods)
                    const estimatedLine = calculateRentalEstimate(quantity, option.price, periods)
                    const isAtLineLimit = quantity === 0 && draftOptions.length >= MAX_CHANGE_LINES
                    return (
                      <article
                        key={option.key}
                        className={"min-w-0 overflow-hidden rounded-xl border bg-card transition " + (
                          quantity > 0 ? "border-primary/55 ring-1 ring-primary/15" : "border-border/70"
                        )}
                      >
                        <div className="relative aspect-[5/4] overflow-hidden bg-muted/55">
                          {option.imageUrl ? (
                            <Image
                              src={option.imageUrl}
                              alt={option.barang_nama}
                              fill
                              unoptimized
                              sizes="(max-width: 640px) 46vw, 220px"
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="grid size-full place-items-center text-primary/55">
                              {option.target_kind === "package"
                                ? <Package className="size-8" strokeWidth={1.25} />
                                : option.kind === "rental"
                                  ? <Tent className="size-8" strokeWidth={1.25} />
                                  : <ShoppingBag className="size-8" strokeWidth={1.25} />}
                            </div>
                          )}
                          <span className="absolute left-2 top-2 rounded-full border border-white/30 bg-background/90 px-2 py-1 text-[9px] font-bold text-foreground">
                            {option.kind === "rental" ? "SEWA" : "BELI"}
                          </span>
                          {quantity > 0 ? (
                            <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                              {quantity}
                            </span>
                          ) : null}
                          {option.discountPercent > 0 && option.normalPrice > option.price ? (
                            <span className="absolute bottom-2 right-2 rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-bold text-white">
                              Hemat {Math.round(option.discountPercent)}%
                            </span>
                          ) : null}
                        </div>
                        <div className="flex min-h-[150px] flex-col p-2.5">
                          <p className="line-clamp-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{option.kategori_nama}</p>
                          <p className="mt-0.5 line-clamp-2 min-h-8 text-[11px] font-semibold leading-4">{option.barang_nama}</p>
                          {option.varian_nama ? <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">{option.varian_nama}</p> : null}
                          {option.deskripsi ? <p className="mt-1 line-clamp-2 text-[9px] leading-3.5 text-muted-foreground">{option.deskripsi}</p> : null}
                          <div className="mt-1.5">
                            {option.discountPercent > 0 && option.normalPrice > option.price ? (
                              <p className="text-[9px] text-muted-foreground line-through">{formatRupiah(option.normalPrice)}</p>
                            ) : null}
                            <p className="text-xs font-bold leading-4 text-primary">{formatRupiah(option.price)}</p>
                            <p className="text-[9px] leading-4 text-muted-foreground">
                              {option.kind === "rental"
                                ? "/ " + (option.priceDurationValue ?? 1) + " " + (option.priceDurationUnit ?? "hari")
                                : "/ unit"}
                            </p>
                          </div>
                          {option.kind === "rental" ? (
                            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                              {periods} periode · 1 unit: <strong className="text-foreground">{formatRupiah(estimatedPerUnit)}</strong>
                            </p>
                          ) : null}
                          <div className="mt-auto pt-2">
                            {quantity === 0 ? (
                              <button
                                type="button"
                                onClick={() => addDraftOption(option.key)}
                                disabled={submitting || isAtLineLimit}
                                className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-primary px-2 text-[10px] font-bold text-primary-foreground disabled:opacity-40"
                              >
                                <Plus className="size-3.5" /> Tambah
                              </button>
                            ) : (
                              <div className="flex items-center justify-between gap-1 rounded-lg border border-primary/25 bg-primary/[0.045] p-1">
                                <button
                                  type="button"
                                  onClick={() => updateDraftQuantity(option.key, quantity - 1)}
                                  disabled={submitting}
                                  aria-label={"Kurangi " + option.barang_nama}
                                  className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-card text-sm disabled:opacity-40"
                                >
                                  −
                                </button>
                                <span className="min-w-5 text-center text-xs font-bold tabular-nums">{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateDraftQuantity(option.key, quantity + 1)}
                                  disabled={submitting || quantity >= 20}
                                  aria-label={"Tambah " + option.barang_nama}
                                  className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-card text-sm disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            {quantity > 0 ? (
                              <p className="mt-1 text-right text-[9px] font-semibold text-primary">{formatRupiah(estimatedLine)}</p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
              {draftIncludesRental ? (
                <p className="mt-3 rounded-xl bg-primary/[0.06] px-3 py-2 text-[10px] leading-4 text-muted-foreground">
                  Estimasi otomatis mengikuti periode {formatRentalStayLabel(pickupDate, returnDate) ?? "booking"} ({formatPortalDate(pickupDate)} – {formatPortalDate(returnDate)}).
                </p>
              ) : null}
            </div>

            <footer className="shrink-0 border-t border-border/70 bg-card/95 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Pilihan sementara</p>
                  <p className="text-xs font-semibold">{draftOptions.length} jenis · {draftOptions.reduce((sum, entry) => sum + entry.quantity, 0)} unit</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCatalogOpen(false)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground"
                >
                  Selesai memilih
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}

      {activeTab === "manage" && alternativeDraft ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setAlternativeDraft(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="portal-alternative-dialog-title" className="w-full max-w-lg rounded-t-[1.5rem] border border-border/70 bg-card p-4 shadow-2xl sm:rounded-[1.5rem]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Pengajuan alternatif</p>
                <h2 id="portal-alternative-dialog-title" className="mt-1 text-base font-semibold">Ajukan pilihan pengganti?</h2>
              </div>
              <button type="button" onClick={() => setAlternativeDraft(null)} disabled={submitting} aria-label="Tutup konfirmasi alternatif" className="grid size-9 shrink-0 place-items-center rounded-full border border-border disabled:opacity-50"><X className="size-4" /></button>
            </div>
            <div className="mt-3 rounded-xl bg-muted/45 p-3">
              <p className="text-[10px] text-muted-foreground">Barang saat ini</p>
              <p className="mt-0.5 text-xs font-semibold">{alternativeDraft.line.name}{alternativeDraft.line.variant ? " · " + alternativeDraft.line.variant : ""}</p>
              <div className="my-2 border-t border-border/60" />
              <p className="text-[10px] text-muted-foreground">Pilihan yang diajukan</p>
              <p className="mt-0.5 text-sm font-semibold">{alternativeDraft.option.barang_nama}{alternativeDraft.option.varian_nama ? " · " + alternativeDraft.option.varian_nama : ""}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{formatRupiah(alternativeDraft.option.price)}{alternativeDraft.option.priceDurationValue && alternativeDraft.option.priceDurationUnit ? " / " + alternativeDraft.option.priceDurationValue + " " + alternativeDraft.option.priceDurationUnit : ""} · {alternativeDraft.line.quantity} unit</p>
            </div>
            <aside className="mt-3 flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/[0.07] p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-xs leading-5 text-foreground/90">Pilihan ini belum langsung mengganti barang booking. Admin akan meninjau ketersediaan dan kebijakan operasional; perubahan berlaku setelah disetujui.</p>
            </aside>
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setAlternativeDraft(null)} disabled={submitting} className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-xs font-semibold disabled:opacity-50">Kembali</button>
              <button type="button" onClick={() => void confirmAlternativeRequest()} disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                {submitting ? <LoaderCircle className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />} Kirim pengajuan
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "manage" && manageDialog === "schedule" && hasRental && canEdit ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setManageDialog(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="portal-schedule-dialog-title" className="max-h-[94dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.5rem] border border-border/70 bg-card p-3 shadow-2xl sm:rounded-[1.5rem] sm:p-4">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Kelola booking</p><h2 id="portal-schedule-dialog-title" className="mt-1 text-lg font-semibold">Ubah jadwal sewa</h2></div><button type="button" onClick={() => setManageDialog(null)} disabled={submitting} aria-label="Tutup perubahan jadwal" className="grid size-9 place-items-center rounded-full border border-border"><X className="size-4" /></button></div>

            <form onSubmit={requestScheduleChange} className="space-y-3">
              <aside className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/[0.07] p-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-xs leading-5 text-foreground/90">Perubahan jadwal merupakan pengajuan. Admin akan meninjau sesuai kebijakan dan ketersediaan operasional; jadwal baru berlaku setelah disetujui.</p>
              </aside>
              <div className="rounded-2xl border border-primary/25 bg-primary/[0.035] p-3">
                <p className="mb-3 text-xs font-semibold text-primary">Tentukan jadwal baru</p>
                <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5 text-xs font-medium">
                  Tanggal pengambilan
                  <input
                    type="date"
                    required
                    min={minimumSchedulePickupDate}
                    value={schedulePickupDate}
                    onChange={(event) => {
                      const nextPickupDate = event.target.value
                      setSchedulePickupDate(nextPickupDate)
                      if (scheduleReturnDate < nextPickupDate) setScheduleReturnDate(nextPickupDate)
                      setError(null)
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1.5 text-xs font-medium">
                  Tanggal pengembalian
                  <input
                    type="date"
                    required
                    min={schedulePickupDate}
                    value={scheduleReturnDate}
                    onChange={(event) => {
                      setScheduleReturnDate(event.target.value)
                      setError(null)
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                  />
                </label>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                  Untuk memperpanjang masa sewa, tanggal pengambilan tidak perlu diubah. Pertahankan tanggal mulai dan cukup pilih tanggal pengembalian yang baru.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Durasi usulan</span>
                  <strong>{formatRentalStayLabel(schedulePickupDate, scheduleReturnDate) ?? "Periksa tanggal"}</strong>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Estimasi saat ini</span>
                  <strong className="tabular-nums">{formatRupiah(currentScheduleEstimate)}</strong>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Estimasi setelah perubahan</span>
                  <strong className="tabular-nums text-primary">{formatRupiah(proposedScheduleEstimate)}</strong>
                </div>
                <div className="mt-2 border-t border-primary/15 pt-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-foreground">
                      {scheduleEstimateDelta > 0
                        ? "Perkiraan tambahan biaya"
                        : scheduleEstimateDelta < 0
                          ? "Potensi pengurangan biaya"
                          : "Perubahan biaya"}
                    </span>
                    <strong className={"tabular-nums " + (
                      scheduleEstimateDelta > 0 ? "text-amber-600 dark:text-amber-400"
                        : scheduleEstimateDelta < 0 ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                    )}>
                      {scheduleEstimateDelta > 0 ? "+ " : scheduleEstimateDelta < 0 ? "− " : ""}
                      {formatRupiah(Math.abs(scheduleEstimateDelta))}
                    </strong>
                  </div>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                  Estimasi berubah otomatis saat tanggal diperbarui. Nominal final dan ketersediaan tetap menunggu pemeriksaan admin.
                </p>
              </div>
              <button type="submit" disabled={submitting || !scheduleDatesValid} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                {submitting ? <LoaderCircle className="size-3.5 animate-spin" /> : <CalendarDays className="size-3.5" />} Kirim permintaan jadwal
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  )
}
