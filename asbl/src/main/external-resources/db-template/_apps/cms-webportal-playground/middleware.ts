import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { withAuth } from "next-auth/middleware"

const allowedOrigins = [
  "https://mo.bkstg.flowkraft.com",
  "https://mu.bkstg.flowkraft.com",
]

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req })
    const isAuth = !!token
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/register")

    let response: NextResponse | null = null

    if (isAuthPage) {
      if (isAuth) {
        response = NextResponse.redirect(new URL("/dashboard", req.url))
      }
      response = response || NextResponse.next()
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      response = NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    response = response || NextResponse.next()

    // Safely handle origin
    const requestOrigin = req.headers.get("origin") || ""

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      response.headers.set("Access-Control-Allow-Origin", requestOrigin)
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type")
      response.headers.set(
        "Content-Security-Policy",
        "script-src 'self' 'unsafe-inline' https://mo.bkstg.flowkraft.com"
      )
    }

    return response
  },
  {
    callbacks: {
      async authorized() {
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/editor/:path*", "/login", "/register"],
}
