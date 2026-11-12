import SiteLayoutShell from "@/components/site-layout-shell"

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <SiteLayoutShell>{children}</SiteLayoutShell>
}
