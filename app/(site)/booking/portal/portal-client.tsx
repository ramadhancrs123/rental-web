"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { formatRupiah } from "@/lib/supabase"
import { parsePortalAccessFragment } from "@/lib/akasha-smart-booking/portal-link"
import { getAvailabilityIndicator, isAvailabilityConditional, isAvailabilityShortage } from "@/lib/akasha-smart-booking/availability"
import type { Catalog } from "@/lib/catalog"
import {
  getSmartBookingCatalogOptions,
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
    reviewing: "Sedang ditinjau",
    acknowledged: "Sudah ditinjau",
    customer_action_required: "Menunggu tanggapan Anda",
    change_requested: "Perubahan menunggu admin",
    cancellation_pending: "Pembatalan menunggu admin",
    ready_for_checkout: "Sudah ditinjau · lanjut di lokasi",
    cancelled: "Dibatalkan",
    expired: "Kedaluwarsa",
    fulfilled: "Transaksi telah dibuat",
  }
  return labels[status] ?? "Status sedang diperbarui"
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
    preparing: "Barang sedang disiapkan",
    prepared: "Barang disiapkan, menunggu serah-terima",
    ready_for_pickup: "Siap diambil",
    handed_over: "Sudah diserahkan kepada Anda",
    return_in_progress: "Pengembalian sedang diperiksa",
    returned: "Sudah dikembalikan",
  }
  return labels[status] ?? "Sedang ditindaklanjuti pengelola"
}

function rentalTrackingLabel(
  status: string,
  actualPickupAt: string | null,
  returnCompletedAt: string | null,
  returnStartedAt: string | null,
) {
  if (returnCompletedAt) return "Sudah dikembalikan"
  if (returnStartedAt) return "Pengembalian sedang diperiksa"
  if (actualPickupAt) return "Penyewaan aktif · barang telah diserahkan"
  const labels: Record<string, string> = {
    draft: "Menunggu penyiapan barang",
    ready_for_pickup: "Siap diambil",
    active: "Penyewaan aktif",
    return_in_progress: "Pengembalian sedang diperiksa",
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

function optionLabel(option: SmartBookingCatalogOption) {
  const item = option.varian_nama
    ? option.barang_nama + " · " + option.varian_nama
    : option.barang_nama
  const type = option.kind === "rental" ? "Sewa" : "Beli"
  const duration = option.priceDurationValue && option.priceDurationUnit
    ? " / " + option.priceDurationValue + " " + option.priceDurationUnit
    : ""
  return type + " · " + item + " · " + formatRupiah(option.price) + duration
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

  const key = window.crypto.randomUUID()
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
  const [draftQty, setDraftQty] = useState<Record<string, number>>({})
  const [newOptionKey, setNewOptionKey] = useState("")
  const [itemDraftChanged, setItemDraftChanged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const changeIdempotencyKeysRef = useRef(new Map<string, string>())
  const portalBootstrapRef = useRef<Promise<{ portal: PortalData | null; availability: AvailabilityData | null; error: string | null }> | null>(null)

  function applyPortalData(data: PortalData) {
    setPortal(data)
    setPickupDate(data.requested_pickup_date ?? "")
    setReturnDate(data.requested_return_date ?? "")
    setDraftQty(buildDraftQuantities(data.lines ?? [], optionByKey))
    setItemDraftChanged(false)
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
        itemDraftChanged ||
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
        if (active && !submitting && !itemDraftChanged) {
          const latestPortal = body as unknown as PortalData
          setPortal(latestPortal)
          setPickupDate(latestPortal.requested_pickup_date ?? "")
          setReturnDate(latestPortal.requested_return_date ?? "")
          setDraftQty(buildDraftQuantities(latestPortal.lines ?? [], optionByKey))
          setItemDraftChanged(false)
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
                  : "Pembaruan stok belum berhasil.",
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
  }, [portal?.reference_code, itemDraftChanged, optionByKey, submitting])

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
      setMessage("Permintaan berhasil dikirim. Perubahan hanya berlaku setelah ditinjau pengelola.")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Permintaan perubahan gagal dikirim.")
    } finally {
      setSubmitting(false)
    }
  }

  async function requestScheduleChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!pickupDate || !returnDate || returnDate < pickupDate) {
      setError("Tanggal pengembalian harus sama dengan atau setelah tanggal pengambilan.")
      return
    }
    if (pickupDate < new Date().toLocaleDateString("en-CA", { timeZone: portal?.business_timezone ?? "Asia/Jakarta" })) {
      setError("Tanggal pengambilan tidak dapat berada di masa lalu.")
      return
    }
    await submitChange(
      "schedule_change",
      { requested_pickup_date: pickupDate, requested_return_date: returnDate },
      "Customer mengajukan perubahan periode rental.",
    )
  }

  async function requestItemChange() {
    if (!portal) return
    const selected = Object.entries(draftQty)
      .filter(([, quantity]) => quantity > 0)
      .map(([key, quantity]) => ({ option: optionByKey.get(key), quantity }))
      .filter((entry): entry is { option: SmartBookingCatalogOption; quantity: number } => Boolean(entry.option))

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

  async function requestAlternative(line: PortalLine, option: SmartBookingCatalogOption) {
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
    setItemDraftChanged(true)
    setError(null)
  }

  function addDraftOption() {
    const option = optionByKey.get(newOptionKey)
    if (!option) return
    if (!draftQty[option.key] && Object.keys(draftQty).length >= MAX_CHANGE_LINES) {
      setError("Maksimal 10 jenis item dalam satu perubahan.")
      return
    }
    updateDraftQuantity(option.key, Math.min(20, (draftQty[option.key] ?? 0) + 1))
    setNewOptionKey("")
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
  const canEditItems = canEdit && itemChangeOptions.length > 0 && unresolvedLines.length === 0
  const draftOptions = Object.entries(draftQty)
    .map(([key, quantity]) => ({ option: optionByKey.get(key), quantity }))
    .filter((entry): entry is { option: SmartBookingCatalogOption; quantity: number } => Boolean(entry.option))
  const draftEstimate = draftOptions.reduce((sum, entry) => sum + entry.option.price * entry.quantity, 0)
  const draftIncludesRental = draftOptions.some((entry) => entry.option.kind === "rental")

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
        <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-7">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-5" /></span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Portal booking customer</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Masuk dengan kode akses booking, atau buka tautan pribadi yang tersedia pada halaman konfirmasi booking.</p>
          <form onSubmit={login} className="mt-5 space-y-4">
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Kode akses</span>
              <input autoComplete="off" value={accessCode} onChange={(event) => setAccessCode(event.target.value.replace(/[^a-z0-9]/gi, "").slice(0, 40).toUpperCase())} maxLength={40} required className="h-11 w-full rounded-xl border border-border bg-background px-3 uppercase tracking-[0.18em]" placeholder="Contoh: ABCD2345" />
              <span className="block text-xs text-muted-foreground">Kode terbaru terdiri dari 8 karakter. Kode booking lama tetap dapat digunakan selama masih aktif.</span>
            </label>
            {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {message && <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
            <button type="submit" disabled={submitting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Masuk ke portal
            </button>
          </form>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Tidak perlu membuat akun atau memasukkan nomor referensi. Jaga kerahasiaan kode akses dan tautan pribadi Anda.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <header className="rounded-3xl border border-border/70 bg-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Portal customer</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Halo, {portal.customer_name}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Referensi {portal.reference_code}</p>
          </div>
          <button type="button" onClick={() => void logout()} disabled={submitting} aria-label="Keluar dari portal" className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"><LogOut className="size-4" /></button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{statusLabel(portal.workflow_status)}</span>
          <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">Revisi #{portal.revision}</span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Pengambilan</p>
            <p className="mt-1 text-sm font-semibold">{portal.requested_pickup_date ?? "Belum ditentukan"}</p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Pengembalian</p>
            <p className="mt-1 text-sm font-semibold">{portal.requested_return_date ?? "Belum ditentukan"}</p>
          </div>
          <div className="rounded-2xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Estimasi tarif dasar</p>
            <p className="mt-1 text-sm font-semibold">{formatRupiah(portal.quote_total)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Estimasi rental menggunakan satu siklus tarif dasar per item. Ini belum merupakan tagihan final atau bukti transaksi.
        </p>
      </header>

      {portal.transaction_tracking ? (
        <section className="rounded-3xl border border-emerald-500/25 bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300">Tracking transaksi</p>
              <h2 className="mt-1 text-base font-semibold">Booking telah diproses secara operasional</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Dikonversi {formatPortalDateTime(portal.transaction_tracking.converted_at, portal.business_timezone)}.
                {portal.transaction_tracking.checkout_number ? " Nomor checkout " + portal.transaction_tracking.checkout_number + "." : ""}
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Transaksi tercatat
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
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
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
                        <span className="text-[10px] text-muted-foreground">{line.assigned_unit_count} unit tercatat pada proses operasional</span>
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
                Status barang mengikuti pembaruan operasional. Nomor seri dan identitas unit fisik tidak ditampilkan pada portal.
              </p>
            </div>
          ) : null}

          {portal.transaction_tracking.sale ? (
            <div className="mt-3 rounded-2xl border border-border/70 p-4">
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
            Status transaksi diperiksa berkala saat portal terbuka. Perubahan barang setelah transaksi mengikuti prosedur pengelola.
          </p>
        </section>
      ) : null}

      {error && <p role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive"><CircleAlert className="mt-0.5 size-4 shrink-0" />{error}</p>}
      {message && <p role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3 text-sm text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{message}</p>}
      {hasPendingChange && !closed && (
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm leading-5 text-amber-800 dark:text-amber-200">
          Pengelola sedang meninjau permintaan perubahan Anda. Tunggu hasilnya sebelum mengirim perubahan lain.
        </p>
      )}

      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
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
            disabled={submitting || itemDraftChanged}
            title={itemDraftChanged ? "Kirim atau batalkan perubahan sebelum memperbarui data." : "Perbarui status booking"}
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
                <p className="mt-1 text-xs text-muted-foreground">{line.kind === "rental" ? "Rental · tarif dasar per siklus" : "Pembelian · sekali beli"} · {line.quantity} unit</p>
                {line.discount_percent > 0 && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Promo {line.discount_percent}% · hemat {formatRupiah(line.discount_amount)}</p>}
              </div>
              <div className="shrink-0 text-right">
                {line.discount_percent > 0 && <p className="text-xs text-muted-foreground line-through">{formatRupiah(line.normal_price * line.quantity)}</p>}
                <p className="text-sm font-semibold">{formatRupiah(line.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-border/60 pt-3 text-xs leading-5 text-muted-foreground">
          Nilai rental di atas adalah estimasi dasar per siklus tarif, bukan total akhir berdasarkan periode. Pengelola akan memeriksa kembali harga dan ketentuan saat proses transaksi di lokasi.
        </p>
      </section>

      {!closed && !hasPendingChange && (
        <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
          <h2 className="text-base font-semibold">Alternatif sejenis</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Beberapa pilihan lain dari kategori yang sama. Ketertarikan Anda akan dikirim sebagai permintaan untuk ditinjau pengelola, bukan mengganti item secara otomatis.
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
        <p className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm leading-5 text-amber-800 dark:text-amber-200">
          Sebagian item pada booking ini sudah tidak tersedia dalam katalog publik, sehingga perubahan daftar barang tidak dapat diajukan dari portal. Hubungi pengelola untuk bantuan.
        </p>
      )}

      {!portal.transaction_tracking && (
      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
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
            <p className="text-sm text-muted-foreground">Informasi stok belum dapat dimuat. Booking Anda tetap tersimpan.</p>
            <p className="text-xs text-muted-foreground">Gunakan tombol perbarui stok untuk mencoba lagi.</p>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs leading-5 text-amber-800 dark:text-amber-200">
              {availability.customer_notice ?? "Informasi ini menunjukkan kondisi saat diperiksa. Booking tidak menahan stok dan ketersediaan dapat berubah sebelum Anda datang."}
            </div>
            {availabilityRefreshError ? (
              <p role="status" className="text-[11px] leading-5 text-amber-700 dark:text-amber-300">
                {availabilityRefreshError}
              </p>
            ) : null}
            {availabilityIsStale ? (
              <p role="status" className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-2.5 text-[11px] text-amber-800 dark:text-amber-200">
                Informasi stok mungkin sudah usang. Perbarui sebelum mengambil keputusan.
              </p>
            ) : null}
            {availability.lines.some((line) => isAvailabilityShortage(line.status)) ? (
              <p className="rounded-xl border border-destructive/25 bg-destructive/[0.04] p-2.5 text-xs leading-5 text-destructive">
                Sebagian barang belum terlihat mencukupi pada pemeriksaan terakhir. Hubungi pengelola untuk opsi lain; stok akan diperiksa kembali saat transaksi.
              </p>
            ) : availability.lines.some((line) => isAvailabilityConditional(line.status)) ? (
              <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] p-2.5 text-xs leading-5 text-amber-800 dark:text-amber-200">
                Sebagian barang bergantung pada varian lain atau potensi pengembalian dan belum dapat dijanjikan tersedia.
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
                          {projection.status ? <span className="basis-full">Sinyal: <strong className="text-foreground">{availabilityLabel(projection.status)}</strong></span> : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Toleransi pengembalian yang dipakai dalam proyeksi: {availability.return_tolerance_hours} jam. Potensi kembali tidak dihitung sebagai stok siap.
            </p>
          </>
        )}
      </section>
      )}

      {canEditItems && (
        <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 text-primary" />
            <h2 className="text-base font-semibold">Ajukan perubahan barang</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Sesuaikan daftar barang di bawah. Perubahan hanya dikirim sebagai permintaan dan baru berlaku setelah ditinjau pengelola.
          </p>
          {!hasRental && (
            <p className="mt-2 rounded-xl bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">
              Booking ini berisi pembelian saja. Untuk menambahkan rental, buat booking baru agar periode pengambilan dan pengembalian dapat ditentukan dengan benar.
            </p>
          )}
          {itemChangeOptions.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Belum ada item yang dapat diubah melalui portal ini. Hubungi pengelola untuk bantuan.</p>
          ) : (
            <>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={newOptionKey}
                  onChange={(event) => setNewOptionKey(event.target.value)}
                  className="h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-sm"
                  aria-label="Pilih barang atau varian tambahan"
                >
                  <option value="">Pilih barang atau varian tambahan</option>
                  {itemChangeOptions.map((option) => (
                    <option key={option.key} value={option.key}>{optionLabel(option)}</option>
                  ))}
                </select>
                <button type="button" onClick={addDraftOption} disabled={!newOptionKey || submitting} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
                  <Plus className="size-4" /> Tambahkan
                </button>
              </div>

              {draftOptions.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">
                  Belum ada item dalam usulan perubahan.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-border/60 rounded-2xl border border-border/60">
                  {draftOptions.map(({ option, quantity }) => (
                    <div key={option.key} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{option.kind === "rental" ? "Sewa" : "Beli"} · {option.barang_nama}{option.varian_nama ? " · " + option.varian_nama : ""}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatRupiah(option.price)}{option.priceDurationValue && option.priceDurationUnit ? " / " + option.priceDurationValue + " " + option.priceDurationUnit : ""}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={() => updateDraftQuantity(option.key, quantity - 1)} disabled={submitting || quantity <= 1} aria-label="Kurangi jumlah" className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">−</button>
                        <span className="min-w-5 text-center text-sm font-semibold">{quantity}</span>
                        <button type="button" onClick={() => updateDraftQuantity(option.key, quantity + 1)} disabled={submitting || quantity >= 20} aria-label="Tambah jumlah" className="grid size-8 place-items-center rounded-full border border-border text-sm disabled:opacity-40">+</button>
                        <button type="button" onClick={() => updateDraftQuantity(option.key, 0)} disabled={submitting} aria-label="Hapus item dari usulan" className="grid size-8 place-items-center rounded-full border border-border text-destructive disabled:opacity-40">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl bg-muted/45 p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Estimasi tarif dasar usulan</span>
                  <strong className="text-base">{formatRupiah(draftEstimate)}</strong>
                </div>
                {draftIncludesRental && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Periode saat ini: {pickupDate || "belum ditentukan"} – {returnDate || "belum ditentukan"}.
                  </p>
                )}
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Nilai rental memakai satu siklus tarif per item. Pengelola menghitung kembali total berdasarkan periode dan meninjau tarif sebelum menerapkan perubahan.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">{draftOptions.length}/{MAX_CHANGE_LINES} jenis item dalam usulan.</p>
                <button
                  type="button"
                  onClick={() => void requestItemChange()}
                  disabled={submitting || !itemDraftChanged || draftOptions.length === 0}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {submitting && <LoaderCircle className="size-3.5 animate-spin" />} Kirim usulan perubahan
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {!closed && !hasPendingChange && (
        <section className="grid gap-4 lg:grid-cols-2">
          {hasRental && (
            <form onSubmit={requestScheduleChange} className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                <h2 className="text-base font-semibold">Ajukan perubahan jadwal</h2>
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Jadwal tidak berubah sampai pengelola menyetujui permintaan Anda.</p>
              <div className="mt-4 space-y-3">
                <label className="block space-y-1 text-xs font-medium">
                  Tanggal pengambilan
                  <input type="date" required value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                </label>
                <label className="block space-y-1 text-xs font-medium">
                  Tanggal pengembalian
                  <input type="date" required min={pickupDate} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                </label>
                <button type="submit" disabled={submitting} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50">
                  {submitting && <LoaderCircle className="size-3.5 animate-spin" />} Kirim permintaan jadwal
                </button>
              </div>
            </form>
          )}
          <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Pembatalan booking</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Pembatalan juga merupakan permintaan. Booking baru berstatus dibatalkan setelah pengelola menyelesaikannya.</p>
            <button type="button" onClick={() => void requestCancellation()} disabled={submitting} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-destructive/30 text-xs font-semibold text-destructive disabled:opacity-50">
              Ajukan pembatalan
            </button>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold">Riwayat booking</h2>
        {portal.change_requests.length > 0 && (
          <div className="mt-3 space-y-2">
            {portal.change_requests.map((change) => (
              <div key={change.id} className="rounded-xl bg-muted/45 p-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <strong>{requestTypeLabel(change.type)}</strong>
                  <span className="text-muted-foreground">{requestStatusLabel(change.status)}</span>
                </div>
                {change.reason && <p className="mt-1 text-muted-foreground">{change.reason}</p>}
                {change.public_resolution_note && <p className="mt-2 text-foreground">{change.public_resolution_note}</p>}
              </div>
            ))}
          </div>
        )}
        <ol className="mt-4 space-y-3 border-l border-border pl-4">
          {portal.timeline.map((event, index) => (
            <li key={index} className="relative">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
              <p className="text-sm leading-5">{event.message ?? statusLabel(event.type)}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(event.occurred_at).toLocaleString("id-ID", { timeZone: portal.business_timezone || "Asia/Jakarta" })}</p>
            </li>
          ))}
        </ol>
      </section>
    </section>
  )
}
