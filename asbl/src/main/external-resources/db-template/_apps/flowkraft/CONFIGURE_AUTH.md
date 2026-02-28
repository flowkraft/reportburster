# Enabling Authentication

**Default:** All apps work **without authentication** (freely accessible).

Two authentication providers are available: **Supabase Auth** and **Keycloak**. Both are production-ready and cover all common authentication needs — user registration, login, OAuth, JWT-based API protection, and role-based access control. Choose the one your team is most comfortable with. If you are already using Supabase for its other Backend-as-a-Service capabilities (database, storage, realtime, edge functions), then use Supabase Auth as well — it is built-in and requires no additional infrastructure.

---

# Supabase Auth

## Quick Start

```bash
# 1. Navigate to the Supabase directory
cd db/supabase

# 2. Start services
docker compose up -d

# 3. Access Supabase Studio (dashboard)
# URL: http://localhost:3100
# Login: supabase / supabase

# 4. API Gateway (used by apps)
# URL: http://localhost:8100
```

---

## Authentication Behavior

### grails-playground (Grails App — Admin + Portal)

| Auth State | Behavior |
|------------|----------|
| **Disabled** (default) | All routes freely accessible |
| **Enabled** | All routes protected (requires Supabase JWT) |

**Toggle:** `supabase.enabled: false/true` in application.yml

---

### next-playground (Next.js Customer Portal)

| Auth State | Route | Example | Behavior |
|------------|-------|---------|----------|
| **Disabled** (default) | All | `/dashboard`, `/invoice/ABC-123` | Freely accessible |
| **Enabled** | List views | `/invoices`, `/payslips` | Requires login |
| **Enabled** | Dashboard | `/dashboard`, `/settings` | Requires login |
| **Enabled** | Invoice + token | `/invoice/ABC-123?token=xxx` | **Public** (no login) |
| **Enabled** | Invoice - token | `/invoice/ABC-123` | Requires login |
| **Enabled** | Payslip + token | `/payslip/XYZ-789?token=xxx` | **Requires login** (ignores token) |

**Document Type Policies** (middleware.ts):
```typescript
ALWAYS_PROTECTED: ['payslips', 'contracts', 'tax-documents']     // Private info
PUBLIC_WITH_TOKEN: ['invoices', 'receipts', 'quotes']            // Email links OK
ALWAYS_PUBLIC: ['marketing', 'brochures']                         // No auth
```

**Toggle:** `SUPABASE_AUTH_ENABLED=false/true` in .env.local

---

## 1. Configure Users & Roles

Supabase uses a single project with role-based access instead of separate realms.

| Keycloak Concept | Supabase Equivalent |
|------------------|---------------------|
| Realm: `customers` | Role: `customer` in `profiles.role` column |
| Realm: `flowkraft-admin` | Role: `admin` in `profiles.role` column |
| Client: `next-playground` | `ANON_KEY` + RLS policies (no client registration) |
| Client: `admin-grails-playground` | `SERVICE_ROLE_KEY` for admin access |
| User Registration toggle | `DISABLE_SIGNUP=false` in `db/supabase/.env` |
| Service Account | `SERVICE_ROLE_KEY` (bypasses RLS) |

### Create Profiles Table & Policies

Run via Supabase Studio SQL Editor (http://localhost:3100):

```sql
-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (NEW.id, 'customer', NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

To create admin users, sign up normally then promote via SQL:
```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
```

Or disable public signup for admin-only registration:
```bash
# In db/supabase/.env
DISABLE_SIGNUP=true
```

---

## 2. Enable in Applications

### Grails (grails-playground)

**1. Add Dependencies** (build.gradle):
```groovy
// Uncomment for Supabase Auth
// implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
// implementation 'org.springframework.boot:spring-boot-starter-security'
```

**2. Enable** (grails-app/conf/application.yml):
```yaml
# Uncomment and set enabled: true
supabase:
  enabled: true
  url: http://localhost:8100
  jwt-secret: super-secret-jwt-token-with-at-least-32-characters-long  # From db/supabase/.env
```

**Note:** Supabase uses HS256 JWTs signed with a shared secret (not RS256/JWKS like Keycloak). This requires a custom `JwtDecoder` bean:

```groovy
// src/main/groovy/.../SupabaseJwtConfig.groovy
@Configuration
@ConditionalOnProperty(name = 'supabase.enabled', havingValue = 'true')
class SupabaseJwtConfig {

    @Value('${supabase.jwt-secret}')
    String jwtSecret

    @Bean
    JwtDecoder jwtDecoder() {
        SecretKeySpec key = new SecretKeySpec(
            jwtSecret.getBytes(StandardCharsets.UTF_8),
            'HmacSHA256'
        )
        NimbusJwtDecoder.withSecretKey(key).build()
    }
}
```

---

### Next.js (next-playground)

**1. Dependencies**:
```json
"@supabase/supabase-js": "^2.x",
"@supabase/ssr": "^0.5.x"
```

**2. Configure** (.env.local):
```bash
cp .env.example .env.local

# Edit .env.local:
SUPABASE_AUTH_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8100
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

**3. Create Supabase Clients**:

```typescript
// lib/supabase/client.ts (browser)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts (server components / route handlers)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

**4. Middleware** (middleware.ts):

Replace the Keycloak/NextAuth token check with Supabase session check:

```typescript
// Instead of:
//   const { getToken } = await import('next-auth/jwt')
//   const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
//   if (!token) { redirect to /api/auth/signin }

// Use:
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  }
)
const { data: { user } } = await supabase.auth.getUser()
if (!user) { /* redirect to /auth/login */ }
```

The document type policy logic (ALWAYS_PROTECTED, PUBLIC_WITH_TOKEN, ALWAYS_PUBLIC) stays unchanged — it is provider-agnostic.

**5. Customize Document Policies** (optional):

Edit `.env.local` to configure document type authentication:
```bash
# Always require authentication (private documents)
DOC_ALWAYS_PROTECTED=payslips,pay-stubs,contracts,tax-documents,medical-records

# Allow public access with magic token (email-link documents)
DOC_PUBLIC_WITH_TOKEN=invoices,receipts,delivery-notes,quotes,shipping-labels

# Always public - no auth needed (marketing materials)
DOC_ALWAYS_PUBLIC=marketing,brochures
```

---

## 3. Document Access Patterns

### Invoice Email Workflow

**Email sent by ReportBurster:**
```
http://localhost:8420/invoice/ABC-2025-001?token=secret123
```

**Customer Flow:**
1. Clicks link (not logged in)
2. Middleware checks:
   - Route: `/invoice/ABC-2025-001` ✓
   - Token: `secret123` ✓
   - Doc type: `invoices` → PUBLIC_WITH_TOKEN ✓
3. **Views invoice without login** ✅

**If token missing:** Redirects to login page

---

### Payslip Email Workflow

**Email sent:**
```
http://localhost:8420/payslip/PAY-2025-001?token=xxx
```

**Employee Flow:**
1. Clicks link
2. Middleware checks:
   - Route: `/payslip/PAY-2025-001` ✓
   - Token: `xxx` ✓ (but **ignored**)
   - Doc type: `payslips` → ALWAYS_PROTECTED ✓
3. **Redirects to login page** 🔒
4. After login → Shows payslip (if authorized)

---

## 4. Admin Access

**Problem:** Admin staff need to manage customer data.

**Solution:** `SERVICE_ROLE_KEY` — bypasses Row Level Security for server-side admin operations.

### Config (application.yml):
```yaml
supabase:
  admin:
    service-role-key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
    url: http://localhost:8100
```

### Use in Admin App

**Code** (grails-playground/grails-app/services/SupabaseAdminService.groovy):
```groovy
@Service
class SupabaseAdminService {
    // SERVICE_ROLE_KEY bypasses RLS — use for admin operations only

    @Value('${supabase.admin.service-role-key}')
    String serviceRoleKey

    @Value('${supabase.admin.url}')
    String supabaseUrl

    List<Map> listCustomers() {
        // GET ${supabaseUrl}/rest/v1/profiles?role=eq.customer
        // Headers:
        //   apikey: ${serviceRoleKey}
        //   Authorization: Bearer ${serviceRoleKey}
    }

    Map getCustomer(String userId) {
        // GET ${supabaseUrl}/rest/v1/profiles?id=eq.${userId}
        // Headers: same as above
    }
}
```

---

## Testing

### Without Supabase Auth (Default)
```bash
curl http://localhost:8400/  # ✅ grails-playground
curl http://localhost:8420/  # ✅ next-playground
```

### With Supabase Auth Enabled

**Sign up a test user:**
```bash
curl -X POST http://localhost:8100/auth/v1/signup \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'
```

**Sign in (get JWT):**
```bash
curl -X POST 'http://localhost:8100/auth/v1/token?grant_type=password' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'
# Returns: { "access_token": "eyJ...", ... }
```

**Grails (all protected):**
```bash
curl http://localhost:8400/  # 🔒 401 Unauthorized

# With Supabase JWT:
curl http://localhost:8400/ \
  -H "Authorization: Bearer ACCESS_TOKEN_FROM_SIGNIN"  # ✅ 200 OK
```

**Customer Portal (granular):**
```bash
# Invoice with token (public):
curl "http://localhost:8420/invoice/ABC?token=valid"  # ✅ 200 OK

# Invoice without token (protected):
curl "http://localhost:8420/invoice/ABC"  # 🔒 302 /auth/login

# Payslip with token (still protected):
curl "http://localhost:8420/payslip/PAY?token=valid"  # 🔒 302 /auth/login

# Dashboard (always protected):
curl "http://localhost:8420/dashboard"  # 🔒 302 /auth/login
```

---

## Quick Toggle

**Disable Supabase Auth:**
```bash
# Option 1: Stop the auth service
docker compose -f db/supabase/docker-compose.yml stop auth

# Option 2: Set flag
# grails-playground: supabase.enabled: false (in application.yml)
# next-playground: SUPABASE_AUTH_ENABLED=false (in .env.local)
```

Apps fall back to no-auth/mock-auth automatically.

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a cryptographically random 32+ character string
- [ ] Change `SUPABASE_PASSWORD` (Postgres password)
- [ ] Change `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`
- [ ] Generate new `ANON_KEY` and `SERVICE_ROLE_KEY` matching the new `JWT_SECRET`
- [ ] Enable HTTPS (Kong HTTPS on port 8143)
- [ ] Set `DISABLE_SIGNUP=true` if registration should be admin-only
- [ ] Configure `ADDITIONAL_REDIRECT_URLS` for production domains
- [ ] Set `GOTRUE_MAILER_AUTOCONFIRM=false` and configure SMTP for auth emails
- [ ] Configure backup strategy for `supabase_data` volume
- [ ] Never expose `SERVICE_ROLE_KEY` to client-side code

---

## Troubleshooting

**Supabase won't start:**
```bash
docker compose -f db/supabase/docker-compose.yml logs auth
docker compose -f db/supabase/docker-compose.yml logs kong
```

**Auth fails:**
- Check GoTrue health:
  ```bash
  curl http://localhost:8100/auth/v1/health
  ```
- Verify ANON_KEY works:
  ```bash
  curl http://localhost:8100/rest/v1/ \
    -H "apikey: YOUR_ANON_KEY"
  ```
- Ensure `JWT_SECRET` in `db/supabase/.env` matches the secret in your app config

---

---

# Keycloak

## Quick Start

```bash
# 1. Create a keycloak/docker-compose.yml (see Section 1 below)
# 2. Start services
docker compose -f keycloak/docker-compose.yml up -d

# 3. Access Keycloak admin
# URL: http://localhost:8480
# Login: admin / admin
```

---

## Authentication Behavior

### grails-playground (Grails App — Admin + Portal)

| Auth State | Behavior |
|------------|----------|
| **Disabled** (default) | All routes freely accessible |
| **Enabled** | All routes protected (requires Keycloak login) |

**Toggle:** `keycloak.enabled: false/true` in application.yml

---

### next-playground (Next.js Customer Portal)

| Auth State | Route | Example | Behavior |
|------------|-------|---------|----------|
| **Disabled** (default) | All | `/dashboard`, `/invoice/ABC-123` | Freely accessible |
| **Enabled** | List views | `/invoices`, `/payslips` | Requires login |
| **Enabled** | Dashboard | `/dashboard`, `/settings` | Requires login |
| **Enabled** | Invoice + token | `/invoice/ABC-123?token=xxx` | **Public** (no login) |
| **Enabled** | Invoice - token | `/invoice/ABC-123` | Requires login |
| **Enabled** | Payslip + token | `/payslip/XYZ-789?token=xxx` | **Requires login** (ignores token) |

**Document Type Policies** (middleware.ts):
```typescript
ALWAYS_PROTECTED: ['payslips', 'contracts', 'tax-documents']     // Private info
PUBLIC_WITH_TOKEN: ['invoices', 'receipts', 'quotes']            // Email links OK
ALWAYS_PUBLIC: ['marketing', 'brochures']                         // No auth
```

**Toggle:** `KEYCLOAK_ENABLED=false/true` in .env.local

---

## 1. Enable Keycloak Service

Create `flowkraft/keycloak/docker-compose.yml` with the Keycloak services.

### PostgreSQL (Production - Recommended)

```yaml
services:
  keycloak-postgres:
    image: postgres:15-alpine
    container_name: fkraft-keycloak-db
    environment:
      - POSTGRES_DB=keycloak
      - POSTGRES_USER=keycloak
      - POSTGRES_PASSWORD=keycloak_secret_password  # CHANGE IN PRODUCTION!
    volumes:
      - keycloak-postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak -d keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5

  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: fkraft-keycloak
    depends_on:
      keycloak-postgres:
        condition: service_healthy
    ports:
      - "8480:8080"
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - KC_DB=postgres
      - KC_DB_URL=jdbc:postgresql://keycloak-postgres:5432/keycloak
      - KC_DB_USERNAME=keycloak
      - KC_DB_PASSWORD=keycloak_secret_password
      - KC_HOSTNAME=localhost
      - KC_HOSTNAME_PORT=8480
      - KC_HOSTNAME_STRICT=false
      - KC_HTTP_ENABLED=true
      - KC_HEALTH_ENABLED=true
    command: start-dev  # Use 'start' for production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health/ready"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

volumes:
  keycloak-postgres-data:
```

### H2 (Development Alternative)

Replace the Keycloak environment block with:
```yaml
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
      - KC_DB=h2-file
      - KC_DB_URL_PATH=/opt/keycloak/data/h2
    volumes:
      - keycloak-data:/opt/keycloak/data
```
And remove the `keycloak-postgres` service and `depends_on`.

---

## 2. Configure Realms & Clients

### Create Realms

**customers** (B2B/B2C Portal)
```
Name: customers
Settings:
  ✓ User Registration
  ✓ Email Verification
  ✓ Forgot Password
```

**flowkraft-admin** (Internal Staff)
```
Name: flowkraft-admin
Settings:
  ✗ User Registration (admin creates users)
```

### Create Clients

**next-playground** (customers realm)
```
Client ID: next-playground
Root URL: http://localhost:8420
Valid Redirect URIs: http://localhost:8420/*
Web Origins: +
```

**grails-playground** (flowkraft-admin realm)
```
Client ID: admin-grails-playground
Root URL: http://localhost:8400
Valid Redirect URIs: http://localhost:8400/*
```

---

## 3. Enable in Applications

### Grails (grails-playground)

**1. Add Dependencies** (build.gradle):
```groovy
// Uncomment for Keycloak
// implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
// implementation 'org.springframework.boot:spring-boot-starter-security'
```

**2. Enable** (grails-app/conf/application.yml):
```yaml
# Uncomment and set enabled: true
keycloak:
  enabled: true
  auth-server-url: http://localhost:8480
  realm: flowkraft-admin
  resource: admin-grails-playground
```

---

### Next.js (next-playground)

**1. Dependencies** (already installed):
```json
"next-auth": "4.24.13"
```

**2. Configure** (.env.local):
```bash
cp .env.example .env.local

# Edit .env.local:
KEYCLOAK_ENABLED=true
KEYCLOAK_CLIENT_ID=next-playground
KEYCLOAK_CLIENT_SECRET=get-from-keycloak-admin
KEYCLOAK_ISSUER=http://localhost:8480/realms/customers
NEXTAUTH_URL=http://localhost:8420
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

**3. Customize Document Policies** (optional):

Edit `.env.local` to configure document type authentication:
```bash
# Always require authentication (private documents)
DOC_ALWAYS_PROTECTED=payslips,pay-stubs,contracts,tax-documents,medical-records

# Allow public access with magic token (email-link documents)
DOC_PUBLIC_WITH_TOKEN=invoices,receipts,delivery-notes,quotes,shipping-labels

# Always public - no auth needed (marketing materials)
DOC_ALWAYS_PUBLIC=marketing,brochures
```

---

## 4. Document Access Patterns

### Invoice Email Workflow

**Email sent by ReportBurster:**
```
http://localhost:8420/invoice/ABC-2025-001?token=secret123
```

**Customer Flow:**
1. Clicks link (not logged in)
2. Middleware checks:
   - Route: `/invoice/ABC-2025-001` ✓
   - Token: `secret123` ✓
   - Doc type: `invoices` → PUBLIC_WITH_TOKEN ✓
3. **Views invoice without login** ✅

**If token missing:** Redirects to Keycloak login

---

### Payslip Email Workflow

**Email sent:**
```
http://localhost:8420/payslip/PAY-2025-001?token=xxx
```

**Employee Flow:**
1. Clicks link
2. Middleware checks:
   - Route: `/payslip/PAY-2025-001` ✓
   - Token: `xxx` ✓ (but **ignored**)
   - Doc type: `payslips` → ALWAYS_PROTECTED ✓
3. **Redirects to Keycloak login** 🔒
4. After login → Shows payslip (if authorized)

---

## 5. Cross-Realm Admin Access

**Problem:** Admin staff (flowkraft-admin realm) need to manage customers (customers realm).

**Solution:** Service Account

### Setup (in Keycloak)

**1. Create Client** (customers realm):
```
Client ID: admin-service-account
Access Type: confidential
Service Accounts Enabled: ON
```

**2. Assign Roles:**
```
Service Account Roles → realm-management:
  ✓ view-users
  ✓ manage-users
  ✓ query-users
```

**3. Get Secret:** Clients → admin-service-account → Credentials → Copy secret

### Use in Admin App

**Config** (application.yml):
```yaml
keycloak:
  admin:
    service-account:
      client-id: admin-service-account
      client-secret: your-secret-from-keycloak
```

**Code** (grails-playground/grails-app/services/KeycloakAdminService.groovy):
```groovy
@Service
class KeycloakAdminService {
    String getServiceAccountToken() {
        // POST http://localhost:8480/realms/customers/protocol/openid-connect/token
        // grant_type=client_credentials, client_id, client_secret
    }

    List<Map> listCustomers() {
        def token = getServiceAccountToken()
        // GET http://localhost:8480/admin/realms/customers/users
        // Authorization: Bearer ${token}
    }
}
```

---

## Testing

### Without Keycloak (Default)
```bash
curl http://localhost:8400/  # ✅ grails-playground
curl http://localhost:8420/  # ✅ next-playground
```

### With Keycloak Enabled

**Grails (all protected):**
```bash
curl http://localhost:8400/  # 🔒 401 Unauthorized
```

**Customer Portal (granular):**
```bash
# Invoice with token (public):
curl "http://localhost:8420/invoice/ABC?token=valid"  # ✅ 200 OK

# Invoice without token (protected):
curl "http://localhost:8420/invoice/ABC"  # 🔒 302 /auth/signin

# Payslip with token (still protected):
curl "http://localhost:8420/payslip/PAY?token=valid"  # 🔒 302 /auth/signin

# Dashboard (always protected):
curl "http://localhost:8420/dashboard"  # 🔒 302 /auth/signin
```

---

## Quick Toggle

**Disable Keycloak:**
```bash
# Option 1: Stop service
docker-compose stop keycloak

# Option 2: Set flag
# grails-playground: keycloak.enabled: false (in application.yml)
# next-playground: KEYCLOAK_ENABLED=false (in .env.local)
```

Apps fall back to no-auth/mock-auth automatically.

---

## Production Checklist

- [ ] Change admin password
- [ ] Use PostgreSQL (not H2)
- [ ] Enable HTTPS/TLS
- [ ] Update CORS origins
- [ ] Set secure cookie flags
- [ ] Enable brute force protection
- [ ] Configure backup strategy

---

## Troubleshooting

**Keycloak won't start:**
```bash
docker-compose logs keycloak
lsof -i :8480
```

**Auth fails:**
- Verify redirect URIs match exactly
- Check client secret
- Test issuer endpoint:
  ```bash
  curl http://localhost:8480/realms/customers/.well-known/openid-configuration
  ```

**Cross-realm fails:**
- Verify service account roles
- Check token request from correct realm
