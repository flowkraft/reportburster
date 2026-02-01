// ===================================================================
// NEXTAUTH.JS KEYCLOAK INTEGRATION
// ===================================================================
// Automatically enabled/disabled via KEYCLOAK_ENABLED environment variable
// No code changes needed - just set KEYCLOAK_ENABLED=true in .env.local
// ===================================================================

import { NextRequest, NextResponse } from "next/server"

const KEYCLOAK_ENABLED = process.env.KEYCLOAK_ENABLED === 'true'

// When Keycloak is disabled, return a simple response without initializing NextAuth
// This avoids all the NO_SECRET and NEXTAUTH_URL warnings
async function disabledAuthHandler() {
  return NextResponse.json(
    { message: "Authentication is disabled. Set KEYCLOAK_ENABLED=true to enable." },
    { status: 200 }
  )
}

// Only initialize NextAuth when Keycloak is enabled
let handler: (req: NextRequest, context: any) => Promise<Response>

if (KEYCLOAK_ENABLED) {
  // Dynamic import to avoid loading NextAuth when disabled
  const NextAuth = require("next-auth").default
  const KeycloakProvider = require("next-auth/providers/keycloak").default

  const authOptions = {
    providers: [
      KeycloakProvider({
        clientId: process.env.KEYCLOAK_CLIENT_ID!,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
        issuer: process.env.KEYCLOAK_ISSUER!,
      })
    ],

    callbacks: {
      async session({ session, token }: any) {
        session.user.id = token.sub
        return session
      },

      async jwt({ token, account }: any) {
        if (account) {
          token.accessToken = account.access_token
        }
        return token
      }
    },

    pages: {
      signIn: '/auth/signin',
    },

    session: {
      strategy: "jwt" as const,
    },

    secret: process.env.NEXTAUTH_SECRET,
  }

  handler = NextAuth(authOptions)
} else {
  handler = disabledAuthHandler as any
}

export { handler as GET, handler as POST }
