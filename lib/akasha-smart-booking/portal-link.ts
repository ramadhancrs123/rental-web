export type PortalAccessFragment = {
  present: boolean
  token: string | null
}

const PORTAL_TOKEN_PATTERN = /^[0-9a-f]{64}$/i

export function parsePortalAccessFragment(fragment: string): PortalAccessFragment {
  if (!fragment.startsWith("#")) return { present: false, token: null }
  const params = new URLSearchParams(fragment.slice(1))
  if (!params.has("access")) return { present: false, token: null }

  const candidate = params.get("access") ?? ""
  return {
    present: true,
    token: PORTAL_TOKEN_PATTERN.test(candidate) ? candidate.toLowerCase() : null,
  }
}

export function createPortalAccessUrl(origin: string, token: string): string | null {
  if (!PORTAL_TOKEN_PATTERN.test(token)) return null
  try {
    const url = new URL("/booking/portal", origin)
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return null
    }
    url.hash = new URLSearchParams({ access: token.toLowerCase() }).toString()
    return url.toString()
  } catch {
    return null
  }
}
