"use client"

import { usePathname } from "next/navigation"
import SiteHeader from "@/components/site-header"
import SiteFooter from "@/components/site-footer"

export default function SiteLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCustomerPortal = pathname === "/booking/portal"

  return (
    <>
      {!isCustomerPortal ? <SiteHeader /> : null}
      <main>{children}</main>
      {!isCustomerPortal ? <SiteFooter /> : null}
    </>
  )
}
