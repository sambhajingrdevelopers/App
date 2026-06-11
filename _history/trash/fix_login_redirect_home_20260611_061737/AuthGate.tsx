"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/signup",
  "/forgot-password",
  "/reset-password",
]

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith("/api")) return true
  if (pathname.startsWith("/media")) return true
  if (pathname.startsWith("/_next")) return true
  return false
}

function hasLogin() {
  if (typeof window === "undefined") return false

  const keys = [
    "token",
    "authToken",
    "accessToken",
    "vibeloop_token",
    "vibeloop_auth",
    "currentUser",
    "user",
    "profile",
  ]

  const localOk = keys.some((k) => {
    const v = localStorage.getItem(k)
    return v && v !== "null" && v !== "undefined" && v !== ""
  })

  const sessionOk = keys.some((k) => {
    const v = sessionStorage.getItem(k)
    return v && v !== "null" && v !== "undefined" && v !== ""
  })

  const cookieOk =
    document.cookie.includes("vibeloop_auth=1") ||
    document.cookie.includes("authToken=") ||
    document.cookie.includes("token=")

  return localOk || sessionOk || cookieOk
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (isPublicPath(pathname)) {
      setAllowed(true)
      return
    }

    if (!hasLogin()) {
      setAllowed(false)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    setAllowed(true)
  }, [pathname, router])

  if (!allowed && !isPublicPath(pathname)) {
    return (
      <main style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        background: "#070711",
        color: "white",
        fontFamily: "system-ui",
        padding: 24,
        textAlign: "center"
      }}>
        <div>
          <h1 style={{ fontSize: 34, marginBottom: 10 }}>Login Required</h1>
          <p style={{ opacity: 0.65 }}>Please login to open VibeLoop.</p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
