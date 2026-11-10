type CryptoProvider = {
  randomUUID?: () => string
  getRandomValues?: (array: Uint8Array) => Uint8Array
}

/**
 * UUID v4 for request idempotency. It is an identifier, not an authentication
 * credential. Native secure randomness is preferred; Math.random is a final
 * compatibility fallback for older/insecure WebViews without Web Crypto.
 */
export function createClientId(provider?: CryptoProvider): string {
  const cryptoProvider = provider ?? (
    typeof globalThis !== "undefined" && "crypto" in globalThis
      ? globalThis.crypto as CryptoProvider
      : undefined
  )

  if (typeof cryptoProvider?.randomUUID === "function") {
    try {
      return cryptoProvider.randomUUID()
    } catch {
      // Older WebViews can expose randomUUID but fail when the context is not secure.
    }
  }

  const bytes = new Uint8Array(16)
  if (typeof cryptoProvider?.getRandomValues === "function") {
    try {
      cryptoProvider.getRandomValues(bytes)
    } catch {
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = Math.floor(Math.random() * 256)
      }
    }
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-")
}
