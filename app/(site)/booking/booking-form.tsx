"use client"

import { useActionState, useMemo, useRef, useState } from "react"
import { CalendarDays, MessageCircle, Minus, Plus, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitBooking, type BookingResult } from "@/app/actions/booking"
import { formatRupiah, WA_NUMBER } from "@/lib/supabase"
import { cn } from "@/lib/utils"

type BookableVariant = {
  varian_barang_id: string
  nama: string
  barang_nama: string
  kategori_nama: string
  price: number
}

function createIdempotencyKey(): string {
  const bytes = new Uint8Array(16)
  window.crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-")
}

function getBookingFingerprint(form: HTMLFormElement): string {
  const entries = Array.from(new FormData(form).entries())
    .filter(([name]) => name !== "idempotency_key")
    .map(([name, value]) => [
      name,
      typeof value === "string" ? value : value.name + ":" + value.size + ":" + value.type,
    ])
  return JSON.stringify(entries)
}

function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function dayAfterISO(start: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return tomorrowISO()
  const d = new Date(`${start}T00:00:00`)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function BookingForm({
  items,
}: {
  items: BookableVariant[]
}) {
  const [state, formAction, pending] = useActionState<BookingResult | null, FormData>(
    submitBooking,
    null
  )

  const idempotencyKeyInputRef = useRef<HTMLInputElement | null>(null)
  const currentIdempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const submittedIdempotencyKeysRef = useRef(new Map<string, string>())

  const syncIdempotencyKey = (form: HTMLFormElement, submitted = false) => {
    const fingerprint = getBookingFingerprint(form)
    const submittedKey = submittedIdempotencyKeysRef.current.get(fingerprint)
    const currentKey = currentIdempotencyRef.current?.fingerprint === fingerprint
      ? currentIdempotencyRef.current.key
      : null
    const key = submittedKey ?? currentKey ?? createIdempotencyKey()

    currentIdempotencyRef.current = { fingerprint, key }
    if (submitted) submittedIdempotencyKeysRef.current.set(fingerprint, key)

    if (idempotencyKeyInputRef.current) {
      idempotencyKeyInputRef.current.value = key
    }
  }

  // kuantitas per varian
  const [qty, setQty] = useState<Record<string, number>>({})
  const [mulai, setMulai] = useState(tomorrowISO())
  const [selesai, setSelesai] = useState(dayAfterISO(tomorrowISO()))

  const setQtySafe = (id: string, val: number) => {
    setQty((prev) => ({ ...prev, [id]: Math.min(20, Math.max(0, Math.floor(val) || 0)) }))
  }

  const selectedCount = useMemo(
    () => items.reduce((acc, i) => acc + (qty[i.varian_barang_id] ?? 0), 0),
    [items, qty]
  )

  const { total, nights } = useMemo(() => {
    const s = new Date(`${mulai}T00:00:00`)
    const e = new Date(`${selesai}T00:00:00`)
    const diff = Math.floor((e.getTime() - s.getTime()) / 86_400_000)
    const n = isNaN(diff) ? 0 : diff + 1
    const t = items.reduce(
      (acc, i) => acc + (qty[i.varian_barang_id] ?? 0) * i.price,
      0
    )
    return { total: t * Math.max(n, 1), nights: n }
  }, [items, qty, mulai, selesai])

  const fieldError = (field: string) =>
    state?.ok === false ? state.fieldErrors?.[field] : undefined

  return (
    <form
      action={formAction}
      onChange={(event) => syncIdempotencyKey(event.currentTarget)}
      onSubmit={(event) => syncIdempotencyKey(event.currentTarget, true)}
      className="space-y-10"
    >
      <input ref={idempotencyKeyInputRef} type="hidden" name="idempotency_key" defaultValue="" />
      {/* Tanggal */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xs">
        <h2 className="mb-5 flex items-center gap-2 text-sm font-medium tracking-widest uppercase">
          <CalendarDays className="size-4 text-primary" />
          Periode Sewa
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mulai">Tanggal mulai</Label>
            <Input
              id="mulai"
              name="mulai"
              type="date"
              value={mulai}
              min={todayISO()}
              onChange={(e) => {
                const v = e.target.value
                setMulai(v)
                if (v && selesai < dayAfterISO(v)) setSelesai(dayAfterISO(v))
              }}
              className={cn("h-11 rounded-xl", fieldError("mulai") && "border-destructive")}
              required
            />
            {fieldError("mulai") && (
              <p className="text-xs text-destructive">{fieldError("mulai")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="selesai">Tanggal selesai</Label>
            <Input
              id="selesai"
              name="selesai"
              type="date"
              value={selesai}
              min={mulai}
              onChange={(e) => setSelesai(e.target.value)}
              className={cn("h-11 rounded-xl", fieldError("selesai") && "border-destructive")}
              required
            />
            {fieldError("selesai") && (
              <p className="text-xs text-destructive">{fieldError("selesai")}</p>
            )}
          </div>
        </div>
        {nights > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Estimasi {nights} hari sewa — harga akhir dikonfirmasi admin.
          </p>
        )}
      </div>

      {/* Item */}
      <div
        className={cn(
          "rounded-3xl border border-border/60 bg-card p-6 shadow-xs",
          fieldError("lines") && "border-destructive"
        )}
      >
        <h2 className="mb-1 text-sm font-medium tracking-widest uppercase">
          Perlengkapan
        </h2>
        <p className="mb-5 text-xs text-muted-foreground">
          Atur jumlah untuk setiap varian yang ingin disewa.
        </p>

        <div className="space-y-6">
          {groupByKategori(items).map(([kategori, variants]) => (
            <div key={kategori} className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">
                {kategori}
              </h3>
              {variants.map((v) => {
                const count = qty[v.varian_barang_id] ?? 0
                return (
                  <div
                    key={v.varian_barang_id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors",
                      count > 0 ? "border-primary/40 bg-primary/5" : "border-border/60"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="font-display italic">{v.barang_nama}</span>
                        {" — "}
                        {v.nama}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(v.price)} / hari
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-full"
                        aria-label={`Kurangi ${v.barang_nama} ${v.nama}`}
                        onClick={() => setQtySafe(v.varian_barang_id, count - 1)}
                        disabled={count <= 0}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={20}
                        value={count}
                        name={`jumlah_${v.varian_barang_id}`}
                        onChange={(e) => setQtySafe(v.varian_barang_id, Number(e.target.value))}
                        className="h-9 w-14 rounded-lg text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-full"
                        aria-label={`Tambah ${v.barang_nama} ${v.nama}`}
                        onClick={() => setQtySafe(v.varian_barang_id, count + 1)}
                        disabled={count >= 20}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {fieldError("lines") && (
          <p className="mt-3 text-xs text-destructive">{fieldError("lines")}</p>
        )}
      </div>

      {/* Data penyewa */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xs">
        <h2 className="mb-5 text-sm font-medium tracking-widest uppercase">
          Data Penyewa
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nama">Nama lengkap</Label>
            <Input
              id="nama"
              name="nama"
              placeholder="Nama kamu"
              className={cn("h-11 rounded-xl", fieldError("nama") && "border-destructive")}
              required
            />
            {fieldError("nama") && (
              <p className="text-xs text-destructive">{fieldError("nama")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telepon">Nomor WhatsApp</Label>
            <Input
              id="telepon"
              name="telepon"
              type="tel"
              inputMode="tel"
              placeholder="08xx xxxx xxxx"
              className={cn("h-11 rounded-xl", fieldError("telepon") && "border-destructive")}
              required
            />
            {fieldError("telepon") && (
              <p className="text-xs text-destructive">{fieldError("telepon")}</p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="catatan">Catatan (opsional)</Label>
          <Textarea
            id="catatan"
            name="catatan"
            placeholder="Contoh: ambil sore hari, rute ke Carmen..."
            className="min-h-20 rounded-xl"
            maxLength={500}
          />
        </div>
      </div>

      {/* Ringkasan & submit */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {selectedCount} item dipilih · {nights} hari
          </span>
          <span>Estimasi total</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-semibold text-primary">{formatRupiah(total)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Estimasi belum termasuk deposit/denda. Harga akhir dikonfirmasi admin
          saat reservasi disetujui.
        </p>

        {state?.ok === false && state.error && (
          <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="mt-6 h-14 w-full rounded-full text-base font-medium"
        >
          {pending ? (
            <>
              <LoaderCircle className="size-5 animate-spin" />
              Memproses booking...
            </>
          ) : (
            "Kirim Booking"
          )}
        </Button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <MessageCircle className="size-3.5 text-primary" />
          Butuh bantuan?
          <a
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            Chat admin via WhatsApp
          </a>
        </div>
      </div>
    </form>
  )
}

function groupByKategori(items: BookableVariant[]): [string, BookableVariant[]][] {
  const map = new Map<string, BookableVariant[]>()
  for (const v of items) {
    const list = map.get(v.kategori_nama) ?? []
    list.push(v)
    map.set(v.kategori_nama, list)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function todayISO(): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0) // hindari geser tanggal karena timezone
  return d.toISOString().slice(0, 10)
}
