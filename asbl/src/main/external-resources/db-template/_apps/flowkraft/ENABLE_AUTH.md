# Enabling Keycloak Authentication

**Default:** All apps work **without authentication** (freely accessible).

---

## Quick Start

```bash
# 1. Uncomment keycloak services in docker-compose.yml (lines 21-84)
# 2. Start services
docker-compose up -d keycloak-postgres keycloak

# 3. Access Keycloak admin
# URL: http://localhost:8480
# Login: admin / admin
```

---

## Authentication Behavior

### admin-grails-playground (Admin Portal)

| Auth State | Behavior |
|------------|----------|
| **Disabled** (default) | All routes freely accessible |
| **Enabled** | All routes protected (requires Keycloak login) |

**Toggle:** `keycloak.enabled: false/true` in application.yml

---

### frend-next-playground (Customer Portal)

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

### PostgreSQL (Production - Default)

Uncomment in docker-compose.yml:
```yaml
keycloak-postgres:    # Lines 21-35
keycloak:             # Lines 38-84
  environment:
    - KC_DB=postgres  # Lines 61-64 (already uncommented)
```

### H2 (Development Alternative)

```yaml
# 1. Comment PostgreSQL lines (61-64)
# 2. Uncomment H2 lines (57-58):
#   - KC_DB=h2-file
#   - KC_DB_URL_PATH=/opt/keycloak/data/h2
```

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

**frend-next-playground** (customers realm)
```
Client ID: frend-next-playground
Root URL: http://localhost:8481
Valid Redirect URIs: http://localhost:8481/*
Web Origins: +
```

**admin-grails-playground** (flowkraft-admin realm)
```
Client ID: admin-grails-playground
Root URL: http://localhost:8482
Valid Redirect URIs: http://localhost:8482/*
```

---

## 3. Enable in Applications

### Grails (admin-grails-playground)

**1. Add Dependencies** (build.gradle):
```groovy
// Uncomment for Keycloak
// implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
// implementation 'org.springframework.boot:spring-boot-starter-security'
```

**2. Enable** (application.yml):
```yaml
# Uncomment and set enabled: true
keycloak:
  enabled: true
  auth-server-url: http://localhost:8480
  realm: flowkraft-admin
  resource: admin-grails-playground
```

---

### Next.js (frend-next-playground)

**1. Dependencies** (already installed):
```json
"next-auth": "4.24.13"
```

**2. Configure** (.env.local):
```bash
cp .env.example .env.local

# Edit .env.local:
KEYCLOAK_ENABLED=true
KEYCLOAK_CLIENT_ID=frend-next-playground
KEYCLOAK_CLIENT_SECRET=get-from-keycloak-admin
KEYCLOAK_ISSUER=http://localhost:8480/realms/customers
NEXTAUTH_URL=http://localhost:8481
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
http://localhost:8481/invoice/ABC-2025-001?token=secret123
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
http://localhost:8481/payslip/PAY-2025-001?token=xxx
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

**Code** (grails-app/services/KeycloakAdminService.groovy):
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
curl http://localhost:8482/  # ✅ admin-grails
curl http://localhost:8481/  # ✅ frend-next
```

### With Keycloak Enabled

**Admin (all protected):**
```bash
curl http://localhost:8482/  # 🔒 401 Unauthorized
```

**Customer Portal (granular):**
```bash
# Invoice with token (public):
curl "http://localhost:8481/invoice/ABC?token=valid"  # ✅ 200 OK

# Invoice without token (protected):
curl "http://localhost:8481/invoice/ABC"  # 🔒 302 /auth/signin

# Payslip with token (still protected):
curl "http://localhost:8481/payslip/PAY?token=valid"  # 🔒 302 /auth/signin

# Dashboard (always protected):
curl "http://localhost:8481/dashboard"  # 🔒 302 /auth/signin
```

---

## Quick Toggle

**Disable Keycloak:**
```bash
# Option 1: Stop service
docker-compose stop keycloak

# Option 2: Set flag
# Grails: keycloak.enabled: false
# Next.js: KEYCLOAK_ENABLED=false
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
