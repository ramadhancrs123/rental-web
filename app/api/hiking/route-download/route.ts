import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const mountainSlug = requestUrl.searchParams.get("mountain_slug")?.trim() ?? ""
  const trailSlug = requestUrl.searchParams.get("trail_slug")?.trim() ?? ""

  if (
    !mountainSlug || !trailSlug ||
    mountainSlug.length > 100 || trailSlug.length > 100 ||
    !SLUG_PATTERN.test(mountainSlug) || !SLUG_PATTERN.test(trailSlug)
  ) {
    return NextResponse.json({ error: "ROUTE_QUERY_REQUIRED", message: "Destinasi dan slug jalur yang valid diperlukan." }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!baseUrl || !anonKey) {
    return NextResponse.json({ error: "HIKING_SERVICE_NOT_CONFIGURED" }, { status: 503 })
  }

  const upstreamUrl = new URL(baseUrl + "/functions/v1/hiking-catalog")
  upstreamUrl.searchParams.set("resource", "route-download")
  upstreamUrl.searchParams.set("mountain_slug", mountainSlug)
  upstreamUrl.searchParams.set("trail_slug", trailSlug)

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/gpx+xml, application/json",
        apikey: anonKey,
        Authorization: "Bearer " + anonKey,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    })

    const contentType = upstream.headers.get("Content-Type") || "application/json; charset=utf-8"
    if (!upstream.ok) {
      const payload = await upstream.text()
      return new Response(payload, {
        status: upstream.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": upstream.headers.get("Content-Disposition") || 'attachment; filename="jalur-pendakian.gpx"',
      "Cache-Control": upstream.headers.get("Cache-Control") || "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "X-Route-Offline-Ready": upstream.headers.get("X-Route-Offline-Ready") || "true",
    })
    const etag = upstream.headers.get("ETag")
    if (etag) headers.set("ETag", etag)

    return new Response(await upstream.arrayBuffer(), { status: 200, headers })
  } catch {
    return NextResponse.json({
      error: "ROUTE_DOWNLOAD_UNAVAILABLE",
      message: "File jalur belum dapat diunduh. Periksa koneksi dan coba lagi.",
    }, { status: 502, headers: { "Cache-Control": "no-store" } })
  }
}
