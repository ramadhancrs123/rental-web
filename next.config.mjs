/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const storageRemotePattern = supabaseUrl
  ? (() => {
      const url = new URL(supabaseUrl)
      return {
        protocol: url.protocol.slice(0, -1),
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/rental-public-media/**",
        search: "",
      }
    })()
  : null

const nextConfig = {
  images: {
    remotePatterns: storageRemotePattern ? [storageRemotePattern] : [],
  },
}

export default nextConfig
