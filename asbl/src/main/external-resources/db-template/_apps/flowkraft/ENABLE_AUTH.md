# Enabling Keycloak Authentication

**Default:** All apps work **without authentication** (freely accessible).

---

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
