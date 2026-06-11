"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

function setAuthCookie() {
  try {
    document.cookie = "vibeloop_auth=1; path=/; max-age=2592000; SameSite=Lax"
    localStorage.setItem("vibeloop_auth", "1")
  } catch {}
}

function getNextPath() {
  try {
    const params = new URLSearchParams(window.location.search)
    const next = params.get("next")
    if (next && next.startsWith("/") && !next.startsWith("/login")) return next
  } catch {}
  return "/home"
}

function hasAuthStorage() {
  try {
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

    return keys.some((key) => {
      const local = localStorage.getItem(key)
      const session = sessionStorage.getItem(key)
      return (
        (local && local !== "null" && local !== "undefined") ||
        (session && session !== "null" && session !== "undefined")
      )
    })
  } catch {
    return false
  }
}

function bodyShowsLoginSuccess() {
  try {
    const text = document.body.innerText.toLowerCase()
    return (
      text.includes("login successful") ||
      text.includes("opening platform") ||
      text.includes("welcome back")
    )
  } catch {
    return false
  }
}

export default function LoginSuccessRedirect() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/login" && pathname !== "/register" && pathname !== "/signup") {
      return
    }

    let done = false

    function redirectNow() {
      if (done) return

      if (hasAuthStorage() || bodyShowsLoginSuccess()) {
        done = true
        setAuthCookie()

        const next = getNextPath()

        setTimeout(() => {
          window.location.replace(next)
        }, 350)
      }
    }

    redirectNow()

    const timer = setInterval(redirectNow, 300)

    const observer = new MutationObserver(() => {
      redirectNow()
    })

    try {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    } catch {}

    return () => {
      clearInterval(timer)
      observer.disconnect()
    }
  }, [pathname])

  return null
}
