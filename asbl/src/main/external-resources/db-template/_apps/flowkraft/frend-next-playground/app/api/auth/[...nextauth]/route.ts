// ===================================================================
// NEXTAUTH.JS KEYCLOAK INTEGRATION
// ===================================================================
// Automatically enabled/disabled via KEYCLOAK_ENABLED environment variable
// No code changes needed - just set KEYCLOAK_ENABLED=true in .env.local
// ===================================================================

import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak"

const KEYCLOAK_ENABLED = process.env.KEYCLOAK_ENABLED === 'true'

const authOptions = {
  providers: KEYCLOAK_ENABLED ? [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    })
  ] : [],

  callbacks: {
    async session({ session, token }: any) {
      if (!KEYCLOAK_ENABLED) {
        // Mock user for development without Keycloak
        session.user = {
          name: "Test User",
          email: "test@example.com",
          id: "test-user-id"
        }
      } else {
        // Real Keycloak user data
        session.user.id = token.sub
      }
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
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
