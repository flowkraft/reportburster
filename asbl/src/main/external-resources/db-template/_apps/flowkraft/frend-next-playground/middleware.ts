// ===================================================================
// ROUTE PROTECTION MIDDLEWARE
// ===================================================================
// Automatically enabled/disabled via KEYCLOAK_ENABLED environment variable
// No code changes needed - just set KEYCLOAK_ENABLED=true in .env.local
//
// Supports granular authentication control:
// - Auth disabled: All routes freely accessible
// - Auth enabled: Per-document-type authentication policies
// ===================================================================

import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"

// ===================================================================
// DOCUMENT TYPE AUTHENTICATION POLICIES
// ===================================================================
// Configured via environment variables (see .env.example)
// Defaults used if env vars not set
// ===================================================================

const DEFAULT_ALWAYS_PROTECTED = ['payslips', 'pay-stubs', 'contracts', 'tax-documents', 'hr-documents']
const DEFAULT_PUBLIC_WITH_TOKEN = ['invoices', 'receipts', 'delivery-notes', 'quotes']
const DEFAULT_ALWAYS_PUBLIC = ['marketing', 'brochures']

// Parse comma-separated env vars or use defaults
const DOCUMENT_AUTH_POLICIES = {
  ALWAYS_PROTECTED: process.env.DOC_ALWAYS_PROTECTED
    ? process.env.DOC_ALWAYS_PROTECTED.split(',')
    : DEFAULT_ALWAYS_PROTECTED,

  PUBLIC_WITH_TOKEN: process.env.DOC_PUBLIC_WITH_TOKEN
    ? process.env.DOC_PUBLIC_WITH_TOKEN.split(',')
    : DEFAULT_PUBLIC_WITH_TOKEN,

  ALWAYS_PUBLIC: process.env.DOC_ALWAYS_PUBLIC
    ? process.env.DOC_ALWAYS_PUBLIC.split(',')
    : DEFAULT_ALWAYS_PUBLIC,
}

// ===================================================================
// MIDDLEWARE LOGIC
// ===================================================================

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // If Keycloak is disabled, allow everything
    if (process.env.KEYCLOAK_ENABLED !== 'true') {
      return NextResponse.next()
    }

    // ─────────────────────────────────────────────────────────────
    // SINGLE DOCUMENT ACCESS: /document/:type/:id
    // ─────────────────────────────────────────────────────────────
    const singleDocMatch = pathname.match(/^\/document\/([^\/]+)\/([^\/]+)/)
    if (singleDocMatch) {
      const [, docType] = singleDocMatch
      const token = req.nextUrl.searchParams.get('token')

      // Check document type policy
      if (DOCUMENT_AUTH_POLICIES.ALWAYS_PUBLIC.includes(docType)) {
        return NextResponse.next()
      }

      if (DOCUMENT_AUTH_POLICIES.PUBLIC_WITH_TOKEN.includes(docType)) {
        if (token) {
          return NextResponse.next()
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // LEGACY ROUTES: /invoice/:id, /payslip/:id
    // ─────────────────────────────────────────────────────────────
    if (pathname.match(/^\/invoice\/[^\/]+/)) {
      const token = req.nextUrl.searchParams.get('token')
      if (token) {
        return NextResponse.next()
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // If Keycloak is disabled, allow all
        if (process.env.KEYCLOAK_ENABLED !== 'true') {
          return true
        }

        const { pathname } = req.nextUrl

        // ─────────────────────────────────────────────────────────
        // PUBLIC ROUTES (even when Keycloak enabled)
        // ─────────────────────────────────────────────────────────
        const publicRoutes = [
          '/auth/signin',
          '/auth/error',
          '/api/auth',
          '/',
        ]

        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // ─────────────────────────────────────────────────────────
        // CHECK FOR MAGIC TOKEN (public document access)
        // ─────────────────────────────────────────────────────────
        const magicToken = req.nextUrl.searchParams.get('token')

        // Allow single document access with magic token
        if (pathname.match(/^\/document\/[^\/]+\/[^\/]+/) && magicToken) {
          return true
        }

        // Legacy invoice route with magic token
        if (pathname.match(/^\/invoice\/[^\/]+/) && magicToken) {
          return true
        }

        // ─────────────────────────────────────────────────────────
        // REQUIRE AUTHENTICATION
        // ─────────────────────────────────────────────────────────
        return !!token
      },
    },
  }
)

// ===================================================================
// ROUTE MATCHER CONFIGURATION
// ===================================================================

export const config = {
  matcher: [
    // Protected routes (require authentication when Keycloak enabled)
    '/dashboard/:path*',
    '/invoices/:path*',
    '/payslips/:path*',
    '/documents/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/profile/:path*',

    // Single document routes (conditional protection)
    '/document/:path*',
    '/invoice/:path*',
    '/payslip/:path*',

    // API routes
    '/api/documents/:path*',
    '/api/invoices/:path*',
    '/api/reports/:path*',
  ]
}
