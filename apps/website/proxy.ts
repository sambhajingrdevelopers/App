import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/signup",
  "/forgot-password",
  "/reset-password",
]

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith("/api")) return true
  if (pathname.startsWith("/media")) return true
  if (pathname.startsWith("/_next")) return true
  if (pathname.includes(".")) return true
  return false
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  const hasAuth =
    request.cookies.get("vibeloop_auth")?.value === "1" ||
    Boolean(request.cookies.get("authToken")?.value) ||
    Boolean(request.cookies.get("token")?.value)

  if (!hasAuth) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/home/:path*",
    "/search/:path*",
    "/camera/:path*",
    "/reels/:path*",
    "/reel/:path*",
    "/post/:path*",
    "/profile/:path*",
    "/u/:path*",
    "/messages/:path*",
    "/notifications/:path*",
    "/settings/:path*",
  ],
}
