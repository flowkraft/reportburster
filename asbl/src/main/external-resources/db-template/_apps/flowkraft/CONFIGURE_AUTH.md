# Authentication & External User Stores

DataPallas Server keeps its own list of users, and for many installations that is all you need. This
document is for the other case: your organisation already runs a directory (LDAP, Active Directory) or
single sign-on (Keycloak, Microsoft Entra ID, Okta, …), and you want people to sign in with the account
they already have instead of you maintaining a second list.

It is **configuration only**: you add properties to one file and restart. Nothing to install, nothing to
rebuild.

---

## 1. Where sign-in applies

| Component | Sign-in |
| --- | --- |
| **DataPallas Desktop** | **None, by design.** One person, one machine. No login screen and no user administration. Nothing in this document applies. |
| **DataPallas Server** | **Required.** Every request needs a session, an API key or an embed token. This is what the rest of this document configures. |
| **AI Hub** | **Uses DataPallas Server's sign-in.** Nothing separate to configure — see [§8](#8-the-ai-hub). |
| **`grails-playground`, `next-playground`** | **Open by default.** They are demonstrations of embedding — see [§9](#9-the-demo-portals). |
| **`xx-custom` apps** | **Their own.** A custom app brings whatever sign-in its author built. |

---

## 2. The default: DataPallas keeps its own users

A freshly installed DataPallas Server needs no external system. On first start it creates one
administrator and says so in the log:

```
*******************************************************************
Created the default administrator:  burst / burst
CHANGE THIS PASSWORD. Until you do, anyone who can reach this
server can sign in as an administrator.
*******************************************************************
```

The login screen shows the same credentials until the password is changed, so **change it first**.
Users are managed from your name (top right) → **Users**.

**If that is all you need, stop reading here.** The rest is for connecting an existing directory or
single sign-on.

---

## 3. What you can connect

| Your system | How people sign in | Section |
| --- | --- | --- |
| **LDAP** — OpenLDAP, lldap, 389 Directory, ApacheDS | They type their directory username and password into the ordinary sign-in form | [§6.1](#61-ldap--openldap-lldap-389-directory-apacheds) |
| **Active Directory** | The same form, with their domain account | [§6.2](#62-active-directory) |
| **OpenID Connect (OIDC)** — Keycloak, Microsoft Entra ID, Okta, Auth0, Google Workspace, Authentik, Zitadel, or any other OIDC provider | A **Sign in with …** button appears on the login page, under the ordinary form | [§6.3](#63-oidc--the-generic-shape) – [§6.6](#66-okta-auth0-google-workspace-authentik-zitadel) |

Not supported:

- **SAML 2.0** — most products that speak SAML also speak OIDC; use that route.
- **SCIM** (automatic joiner/leaver provisioning) — DataPallas creates a person's record the first time
  they sign in, and is never told when somebody leaves. See rule 5 in the next section.
- **Kerberos / SPNEGO** (sign-in with no password prompt).

---

## 4. How it behaves — worth reading before you configure anything

**1. Local accounts keep working.** For a username and password, DataPallas checks its own list
**first**, then the directory. An unreachable or mistyped directory therefore never locks the
administrators out. **Keep one local administrator**, and give them a username that does not exist in
your directory (rule 2 explains why).

**2. Your directory says who somebody is; DataPallas says what they may do.** The first time somebody
signs in, DataPallas creates a record for them — it appears on the Users screen — to hold their role
and their groups. That record has **no password**: the directory or provider is the only way in.

DataPallas picks the username from the sign-in: for LDAP and Active Directory their directory username,
for OIDC the first of the `preferred_username`, `email` and `sub` claims that the provider sends.
Accounts are matched **by username**. If DataPallas already has an account with that name — a local one
with a password included — the person signs in as that account, and your group mapping applies to it.

**3. Roles follow your groups, as long as one of them is mapped.** You map your directory or provider
group names to DataPallas roles with `group-role-map` (see [§6](#6-configuring-each-store)). Group names
are compared ignoring upper and lower case.

- At every sign-in, if the person is in at least one mapped group, their role is set to the
  **strongest** of those groups' roles. Move somebody from your admins group to your authors group and
  they are a REPORT_AUTHOR the next time they sign in. Somebody in both an admins group and a viewers
  group is an ADMIN.
- If the person is in **no** mapped group, nothing is changed: a first-time user gets `default-role`,
  and somebody who already has a role keeps it.

> **Taking somebody out of every mapped group does not lower their role.** They keep the role they
> had. To remove or lower it, change the role on the Users screen, or disable them.

**4. The roles.** These are the values `group-role-map` and `default-role` accept:

| Role | What the person can do |
| --- | --- |
| `ADMIN` | Everything, including connections and their passwords, users, and system settings. |
| `REPORT_AUTHOR` | Everything except connections and users — reports, dashboards, cubes, scripts and templates, running jobs. |
| `JOB_OPERATOR` | The Processing screens only: run jobs, read output and logs. |
| `DASHBOARD_VIEWER` | Opens the dashboards shared with their groups, in the AI Hub. Cannot build or run anything. |

`default-role` is `JOB_OPERATOR` unless you change it. A directory can hold thousands of accounts, and
"this person works here" should not mean "this person may write Groovy". Promote people deliberately,
by group or by hand.

A group cannot grant `PLATFORM_ADMIN`, and a role name DataPallas does not recognise — a typo, say — is
treated as `JOB_OPERATOR`; both are logged as warnings. The older role names are still understood
(`TENANT_ADMIN` is ADMIN, `AUTHOR` is REPORT_AUTHOR, `OPERATOR` is JOB_OPERATOR), but an old `VIEWER`
or `REPORT_VIEWER` now means JOB_OPERATOR, not DASHBOARD_VIEWER.

**5. Disabled people cannot sign in, by any route.** **Disable** on the Users screen stops sign-in with
a password, with the directory and with single sign-on alike, and **Enable** puts the person back with
the role and groups they had. Because DataPallas is not told when somebody leaves, this is how you
switch off a person who stays in your directory but should no longer use DataPallas.

---

## 5. Where the configuration goes

Create or edit:

```
<DataPallas install>/config/application.properties
```

No such file ships, so on a first setup you create it. Spring Boot reads it at startup, so **restart
the server after any change**:

- **Windows:** `shutServer.bat`, then `startServer.bat` — or restart the Windows service.
- **Docker:** `docker compose restart`, in the folder that holds `docker-compose.yml` (its `config`
  folder is the one mounted into the container).

> **Secrets.** Client secrets and directory bind passwords sit in this file in plain text, so restrict
> it to the account the server runs as. To keep a secret out of the file, read it from an environment
> variable instead — for example `client-secret=${DP_OIDC_SECRET}`.

---

## 6. Configuring each store

### 6.1 LDAP — OpenLDAP, lldap, 389 Directory, ApacheDS

```properties
datapallas.ldap.enabled=true
datapallas.ldap.url=ldap://ldap.corp.local:389
datapallas.ldap.base-dn=dc=corp,dc=local

# How to find the account. Set one of these; if you set both, the pattern is tried first.
# A fixed DN pattern, when everyone lives in one branch:
datapallas.ldap.user-dn-patterns=uid={0},ou=people
# ...or a search, when they do not:
#datapallas.ldap.user-search-base=ou=people
#datapallas.ldap.user-search-filter=(uid={0})
# A search needs an account that is allowed to read the directory:
#datapallas.ldap.manager-dn=cn=readonly,dc=corp,dc=local
#datapallas.ldap.manager-password=...

# Groups. Leave out group-role-map and DataPallas skips the group lookup altogether.
datapallas.ldap.group-search-base=ou=groups
datapallas.ldap.group-search-filter=(member={0})
datapallas.ldap.group-role-map.DataPallas-Admins=ADMIN
datapallas.ldap.group-role-map.DataPallas-Authors=REPORT_AUTHOR
datapallas.ldap.group-role-map.DataPallas-Operators=JOB_OPERATOR
datapallas.ldap.group-role-map.DataPallas-Viewers=DASHBOARD_VIEWER

# For somebody in none of those groups (default: JOB_OPERATOR)
datapallas.ldap.default-role=JOB_OPERATOR
```

**lldap** is a lightweight directory and a convenient way to try the whole path before you point
DataPallas at a production one.

### 6.2 Active Directory

Setting `domain` switches to the Active Directory provider, which accepts the domain account directly
and finds it itself — no DN patterns or search filters to get wrong.

```properties
datapallas.ldap.enabled=true
datapallas.ldap.url=ldaps://dc01.corp.local:636
datapallas.ldap.domain=corp.local
datapallas.ldap.base-dn=dc=corp,dc=local

datapallas.ldap.group-role-map.DataPallas-Admins=ADMIN
datapallas.ldap.group-role-map.DataPallas-Authors=REPORT_AUTHOR
datapallas.ldap.default-role=JOB_OPERATOR
```

- Use `ldaps://…:636` in production.
- Groups come from each person's `memberOf` attribute, which lists the groups they belong to
  **directly** — a group reached only through another group is not seen. Map the group people are
  actually in.
- An expired password, a locked account and a wrong password all read as "invalid credentials". That is
  deliberate: a failed sign-in tells an attacker nothing.

### 6.3 OIDC — the generic shape

Two blocks. The first is Spring Boot's standard OAuth2 client configuration, so every provider's own
guide already tells you what goes there. The second is the part no provider's guide can cover: which
claim carries the groups, and what those groups mean in DataPallas.

```properties
# --- the identity provider (standard Spring Boot property names) -----------------
spring.security.oauth2.client.registration.myidp.client-id=datapallas
spring.security.oauth2.client.registration.myidp.client-secret=...
spring.security.oauth2.client.registration.myidp.client-name=Acme SSO
spring.security.oauth2.client.registration.myidp.scope=openid,profile,email
spring.security.oauth2.client.registration.myidp.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.myidp.redirect-uri={baseUrl}/login/oauth2/code/{registrationId}

# Discovery: one line, if the provider publishes /.well-known/openid-configuration
spring.security.oauth2.client.provider.myidp.issuer-uri=https://idp.example.com/realms/acme

# --- what those identities mean in DataPallas ------------------------------------
datapallas.oidc.group-role-map.DataPallas-Admins=ADMIN
datapallas.oidc.group-role-map.DataPallas-Authors=REPORT_AUTHOR
datapallas.oidc.group-role-map.DataPallas-Viewers=DASHBOARD_VIEWER
datapallas.oidc.default-role=JOB_OPERATOR
#datapallas.oidc.display-name=Sign in with Acme      # button label; defaults to client-name
#datapallas.oidc.username-claims=preferred_username,email,sub
#datapallas.oidc.groups-claims=groups,roles
```

- `myidp` is a name you choose. It is part of the callback URL, so it must match what you register at
  the provider:

  ```
  Redirect / callback URL:   https://<your-datapallas-host>:9090/login/oauth2/code/myidp
  ```

- Do not set `user-name-attribute`. DataPallas takes the username from `username-claims`, and a
  `user-name-attribute` naming a claim your provider does not send (Google and Auth0, for instance, send
  no `preferred_username`) can make sign-in fail.
- Some providers release groups only for an extra scope — Okta, for one, wants `groups`. Add it to
  `scope` for those; for the others, an unknown scope can make the provider refuse the request.
- A **Sign in with …** button appears on the DataPallas login page as soon as a registration exists. The
  username and password form stays, which is rule 1.

**Groups are the part that usually needs attention.** Most providers send no groups claim until you
tell them to, and each one names it differently. DataPallas reads `groups` and `roles` by default (both,
if both are present) and copes with the shapes providers actually send: a JSON array, a single string,
a comma-separated string, or Entra ID's objects with a `displayName`. If people do not get the role you
expect, the groups claim is almost always why — see [§10](#10-verifying-and-troubleshooting).

### 6.4 Keycloak

**In Keycloak:**

1. Create a realm, for example `datapallas`.
2. **Clients → Create client** — client ID `datapallas`, client authentication **On**, standard flow
   enabled.
3. **Valid redirect URIs**: `https://<your-datapallas-host>:9090/login/oauth2/code/keycloak`
4. Copy the secret from **Credentials**.
5. **Client scopes → datapallas-dedicated → Add mapper → By configuration → Group Membership**. Set
   **Token Claim Name** to `groups` and turn **Full group path** *off* — otherwise groups arrive as
   `/DataPallas-Admins` and will not match your map.
6. Create the groups (`DataPallas-Admins`, `DataPallas-Authors`, …) and put people in them.

**In DataPallas:**

```properties
spring.security.oauth2.client.registration.keycloak.client-id=datapallas
spring.security.oauth2.client.registration.keycloak.client-secret=<from Credentials>
spring.security.oauth2.client.registration.keycloak.client-name=Keycloak
spring.security.oauth2.client.registration.keycloak.scope=openid,profile,email
spring.security.oauth2.client.registration.keycloak.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.keycloak.redirect-uri={baseUrl}/login/oauth2/code/{registrationId}

spring.security.oauth2.client.provider.keycloak.issuer-uri=https://keycloak.corp.local/realms/datapallas

datapallas.oidc.group-role-map.DataPallas-Admins=ADMIN
datapallas.oidc.group-role-map.DataPallas-Authors=REPORT_AUTHOR
datapallas.oidc.default-role=JOB_OPERATOR
```

> `issuer-uri` is fetched when DataPallas starts. If Keycloak is not reachable at that moment, startup
> fails. Where that matters, list the endpoints yourself (`authorization-uri`, `token-uri`,
> `user-info-uri`, `jwk-set-uri`) instead of using discovery.

### 6.5 Microsoft Entra ID (Azure AD)

```properties
spring.security.oauth2.client.registration.entra.client-id=<application (client) ID>
spring.security.oauth2.client.registration.entra.client-secret=<client secret>
spring.security.oauth2.client.registration.entra.client-name=Microsoft
spring.security.oauth2.client.registration.entra.scope=openid,profile,email
spring.security.oauth2.client.registration.entra.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.entra.redirect-uri={baseUrl}/login/oauth2/code/{registrationId}

spring.security.oauth2.client.provider.entra.issuer-uri=https://login.microsoftonline.com/<tenant-id>/v2.0

datapallas.oidc.group-role-map.<group-object-id>=ADMIN
datapallas.oidc.default-role=JOB_OPERATOR
```

Register `https://<your-datapallas-host>:9090/login/oauth2/code/entra` as a **Web** redirect URI. In
the app registration, **Token configuration → Add groups claim**, and choose **Groups assigned to the
application** to keep the token small.

Entra sends group **object IDs**, not names, so `group-role-map` takes the ID, as above. The alternative
is **App roles**: they arrive by name in a `roles` claim, which DataPallas already reads, so you can map
`DataPallas-Admins` directly. Usernames will be the person's Entra sign-in name, such as
`jane.smith@corp.com`.

### 6.6 Okta, Auth0, Google Workspace, Authentik, Zitadel

All follow [§6.3](#63-oidc--the-generic-shape). Create a **Web / Regular Web Application**, set the
redirect URI to `https://<host>:9090/login/oauth2/code/<your-registration-name>`, and set `issuer-uri`
to the value the provider gives you.

- **Okta** — add a **Groups** claim to the ID token (Security → API → Authorization Servers → Claims),
  filtered to the groups you care about, and add `groups` to `scope`.
- **Auth0** — Auth0 sends no groups by default. Add them with a Login Action that sets a custom claim,
  then set `datapallas.oidc.groups-claims` to whatever you named it.
- **Google Workspace** — Google sends no group membership in the ID token at all. Use it to sign people
  in, give them roles on the Users screen, or put Keycloak in front of it.
- **Authentik, Zitadel** — look for how the provider adds groups to the ID token, then follow §6.3.

---

## 7. After people have signed in

- **Check the Users screen.** Everybody who has signed in appears there, with their role. This is where
  you change a role by hand.
- **Put them in DataPallas groups.** Your directory's groups only decide a person's *role*; they are not
  copied into DataPallas. DataPallas groups — which decide the connections, reports and dashboards
  somebody sees — are chosen on the Users screen, **Edit**, as for any other user.
- **Viewers see nothing yet.** A DASHBOARD_VIEWER opens only the dashboards shared with their DataPallas
  groups, so until you share some, they see no dashboards.
- **A role set by hand holds only while no group is mapped.** If the person is in a mapped group, their
  role is set from it again at the next sign-in.

---

## 8. The AI Hub

The AI Hub (`_ai-hub/ui-startpage`, port 8440) has no user list and no identity-provider settings of
its own. It asks DataPallas Server who is calling, so whatever you configured in §6 applies to it too:
no second registration, no second redirect URI.

- **Same host name.** Cookies are shared between ports but not between host names. Open DataPallas
  (`:9090`) and the AI Hub (`:8440`) under the same host name — not one by IP address and the other by
  name.
- **Password sign-in.** The AI Hub's own sign-in form takes a username and a password: local accounts,
  and directory accounts with LDAP or Active Directory.
- **OIDC sign-in.** That form has no **Sign in with …** button. People sign in on the DataPallas login
  page first; when they then open the AI Hub they are already signed in.
- **Who gets in.** The AI Hub is a place to build, so ADMIN and REPORT_AUTHOR open it. A
  DASHBOARD_VIEWER is taken to the dashboards shared with them. A JOB_OPERATOR is told they cannot use
  it. The AI features — chats, agents, Chat2DB, the language-model settings — are for ADMIN only.
- **Desktop.** No sign-in at all.

The one setting the AI Hub has is where DataPallas Server lives, which the installer sets
(`DP_API_URL=http://host.docker.internal:9090/api` in `_ai-hub/docker-compose.yml`). Change it only if
the AI Hub runs somewhere else.

---

## 9. The demo portals

`grails-playground` and `next-playground` demonstrate **embedding** — putting a DataPallas dashboard or
table inside somebody else's web application. They are open by default: visitors need no account.

The data behind them is still protected. Each portal's *server* holds the DataPallas API key — read
from `config/_internal/api-key.txt`, which is mounted into its container read-only — and uses it to
issue a short-lived embed token for each page. The browser only ever receives a token that unlocks one
report, valid for an hour by default. The API key never reaches a browser.

`next-playground` can also put its own Keycloak sign-in in front of its pages: set
`KEYCLOAK_ENABLED=true` and the `KEYCLOAK_*` values in its `.env.local` (`.env.example` shows them).
That is the portal's own sign-in, separate from DataPallas's. For a portal whose visitors really do sign
in, the `billing-portal-*` examples under `xx-custom/_examples` are the pattern to copy.

---

## 10. Verifying and troubleshooting

After a restart, check in this order:

```bash
# 1. Which sign-in buttons the server offers. [] means no OIDC provider was picked up.
curl http://localhost:9090/api/auth/providers

# 2. Does the redirect to your provider work? Expect 302 and a Location header.
curl -i http://localhost:9090/oauth2/authorization/<your-registration-name>

# 3. Is the default account still in use? usingDefaultCredentials should be false
#    once you have changed the password.
curl http://localhost:9090/api/auth/first-run
```

The startup log states what was switched on:

```
OIDC login enabled
Federated sign-in available: [keycloak]
LDAP authentication enabled against ldap://dc01.corp.local:389 (Active Directory)
Authentication chain: local store first, then 1 federated provider(s)
```

For OIDC, every sign-in also logs one line with the groups the provider sent and the role they were
mapped to — the quickest way to see why somebody got the role they did. The role is listed with every
weaker one it includes:

```
OIDC login for 'jane.smith' — groups [DataPallas-Authors] mapped to ROLE_REPORT_AUTHOR, ROLE_JOB_OPERATOR, ROLE_DASHBOARD_VIEWER
```

| Symptom | Cause |
| --- | --- |
| `/api/auth/providers` returns `[]`, or there is no **Sign in with …** button | No registration was read. Check the file is at `config/application.properties` under the install directory, that the server was restarted, and that both a `registration.<name>` **and** a `provider.<name>` block exist. |
| The server will not start and complains about the issuer | `issuer-uri` is fetched at startup and the provider was unreachable. Fix connectivity, or list the four endpoints explicitly (§6.4). |
| Sign-in works, but everyone arrives as JOB_OPERATOR | The groups claim is not arriving, or its values do not match `group-role-map`. Read the log line above. Keycloak: turn **Full group path** off. Entra: you are probably getting object IDs. Also check the log for `Unknown role … using JOB_OPERATOR` — a typo in a role name has the same effect. |
| Somebody left a mapped group but is still ADMIN | Expected: a role only follows a mapped group while the person is in one (rule 3). Change it on the Users screen, or disable them. |
| A role changed in your directory but not in DataPallas | Roles are applied at sign-in. The person must sign in again. |
| Redirected back to the login page with "recognised but has no access" | The person signed in at the provider but was given no session. Look in the server log: `has no DataPallas role` — the person is **disabled**, or could not be placed (`tenant … does not exist`: leave `default-tenant` at its default, `default`); `no username claim was found` — none of the `username-claims` is in the token. |
| Redirected back with "did not complete" | The provider rejected the exchange. The usual cause is a redirect-URI mismatch: it must be exactly `<baseUrl>/login/oauth2/code/<registration-name>`. The server log has the details. |
| A directory user gets "invalid credentials" | A wrong password — or, with Active Directory, an expired or locked account, which is not distinguished (§6.2). With generic LDAP, check that `user-dn-patterns` or the search settings actually find the person. |
| A script's `POST /api/auth/login` is rejected | The request has no CSRF token. Browsers handle that automatically; machine callers should send an `X-API-Key` header instead, which is exempt. |
| The directory or provider is down or misconfigured | Local accounts keep working (rule 1). Fix the configuration, or comment out its lines and restart. |

---

## 11. Turning it off

Remove (or comment out) the `datapallas.ldap.*` and `spring.security.oauth2.client.*` lines and
restart. Local accounts keep working throughout — they were never switched off. The records created
for directory and provider users stay on the Users screen; they have no password, so nobody can sign in
as them once the provider is gone. **Delete** them there if you want them gone.
