# CMS Web Portal Playground

A WordPress-based document portal for ReportBurster, featuring:
- **Sage Theme** (Roots) with Tailwind CSS v4
- **Pods Framework** for custom post types
- **WPBones Plugin** (reportburster-integration) for template routing

## Quick Start

```powershell
# Start all services
docker compose up -d

# First run takes ~5 minutes (installs WP, Composer deps, npm build)
# Check progress:
docker compose logs -f cms-webportal-playground-cli
docker compose logs -f sage-theme-builder
```

**Access:** http://localhost:8080

**Admin:** http://localhost:8080/wp-admin  
- User: `admin` / Password: see `.env`

**Demo Users:**
| Username | Password | Role |
|----------|----------|------|
| clyde.grew | demo1234 | employee |
| kyle.butford | demo1234 | employee |
| alfreda.waldback | demo1234 | employee |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User visits /my-documents/                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  WordPress loads page with slug "my-documents"              │
│  (created by plugin on activation)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  TemplateController::overridePageTemplate()                 │
│  Hooks 'page_template' filter, checks for matching view     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  render-view.php                                            │
│  Includes: wp-plugins/.../resources/views/page-{slug}.php   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  page-my-documents.php                                      │
│  Calls get_header() → header.php loads Vite/Tailwind CSS    │
└─────────────────────────────────────────────────────────────┘
```

---

## Adding New Templates

### 1. Create the PHP template

Add a new file in the plugin's views directory:
```
wp-plugins/reportburster-integration/resources/views/
├── page-my-documents.php      # /my-documents/
├── page-invoices.php          # /invoices/ (new)
├── single-paystub.php         # /paystub/{id}/
├── single-invoice.php         # /invoice/{id}/ (new)
```

### 2. For page templates, create the WordPress page

The plugin auto-creates `/my-documents/`. For new pages, either:
- Create manually in WP Admin → Pages
- Or add to `AppServiceProvider.php` for auto-creation

### 3. Rebuild Tailwind (if using new CSS classes)

If your new template uses Tailwind classes that don't exist in other templates, you need to rebuild:

**Option 1 - Environment variable (PowerShell):**
```powershell
$env:FORCE_BUILD="true"; docker compose up -d sage-theme-builder
```

**Option 2 - Environment variable (Bash/Linux):**
```bash
FORCE_BUILD=true docker compose up -d sage-theme-builder
```

**Option 3 - Delete manifest to trigger rebuild:**
```powershell
Remove-Item ".\wp-themes\reportburster-sage\public\build\manifest.json" -Force
docker compose up -d sage-theme-builder
```

**Option 4 - Run npm directly (if node_modules exists):**
```powershell
cd wp-themes\reportburster-sage
npm run build
```

---

## Project Structure

```
cms-webportal-playground/
├── docker-compose.yml          # Main orchestration
├── Dockerfile.cli              # WP-CLI + Composer image
├── .env                        # Environment variables
├── config/
│   └── uploads.ini             # PHP upload limits
├── scripts/
│   ├── provision-content-types-and-sample-data.php
│   └── patch-sage/             # Sage theme patches
│       ├── header.php          # Bridge for get_header()
│       ├── footer.php          # Bridge for get_footer()
│       └── resources/css/
│           └── app.css         # Tailwind with plugin @source
├── wp-plugins/
│   └── reportburster-integration/
│       ├── plugin/
│       │   ├── Providers/AppServiceProvider.php
│       │   └── Http/Controllers/TemplateController.php
│       ├── bootstrap/render-view.php
│       └── resources/views/    # PHP templates here
└── wp-themes/
    └── reportburster-sage/     # Created by Composer at runtime
```

---

## Sage Theme Patches

The Sage theme is created fresh via `composer create-project roots/sage`. We apply patches to make it work with plugin templates:

| File | Purpose |
|------|---------|
| `header.php` | Bridge for `get_header()` - loads Vite-built CSS |
| `footer.php` | Bridge for `get_footer()` - closes HTML structure |
| `resources/css/app.css` | Adds `@source` directive to scan plugin for Tailwind classes |

These patches are in `scripts/patch-sage/` and applied by the `sage-theme-builder` container.

### Why These Patches Are Needed

**The Problem:**

Sage v11 is a modern WordPress theme that uses:
- **Blade templates** instead of classic PHP (`app.blade.php`, not `header.php`)
- **Vite** for asset bundling with hashed filenames (`app-WlKM2Wai.css`)
- **Tailwind CSS v4** with JIT (Just-In-Time) compilation

Our `reportburster-integration` plugin uses:
- **Classic PHP templates** (`page-my-documents.php`) that call `get_header()` / `get_footer()`
- **Tailwind classes** in PHP files outside the theme directory

This creates two incompatibilities:

1. **`get_header()` doesn't work** - Sage has no `header.php`, so WordPress falls back to a minimal header that doesn't load Vite assets
2. **Tailwind classes don't compile** - Tailwind only scans files listed in its config, and the plugin directory isn't included

**The Solution:**

#### `scripts/patch-sage/header.php`
```php
// Reads Vite manifest.json to get the hashed CSS filename
$manifest = json_decode(file_get_contents($manifest_path), true);
$css_file = $manifest['resources/css/app.css']['file'];
// Outputs: <link href=".../app-WlKM2Wai.css">
```
This bridges classic WordPress `get_header()` calls to Vite's build output.

#### `scripts/patch-sage/footer.php`
Closes the HTML structure opened by `header.php` and calls `wp_footer()`.

#### `scripts/patch-sage/resources/css/app.css`
```css
@import "tailwindcss" theme(static);
@source "../views/";
@source "../../app/";
@source "../../../../plugins/reportburster-integration/**/*.php";
```
The last `@source` line tells Tailwind v4 to scan the plugin directory for CSS classes.
**Note:** The path uses `plugins/` (not `wp-plugins/`) because this is the path **inside the container** where `/var/www/html/wp-content/plugins/` is mounted.

### How It All Works Together

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DOCKER COMPOSE ORCHESTRATION                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. cms-webportal-playground-cli:                                           │
│     └── composer create-project roots/sage → Fresh Sage theme              │
│     └── wp plugin activate reportburster-integration                        │
│                                                                             │
│  2. sage-theme-builder:                                                     │
│     └── cp /patches/header.php .                    ← Apply patches         │
│     └── cp /patches/footer.php .                                            │
│     └── cp /patches/resources/css/app.css resources/css/app.css            │
│     └── npm install                                                         │
│     └── npm run build → Tailwind scans plugin, generates CSS               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  RUNTIME REQUEST FLOW                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User visits /my-documents/                                                 │
│       │                                                                     │
│       ▼                                                                     │
│  WordPress: "page with slug 'my-documents'"                                 │
│       │                                                                     │
│       ▼                                                                     │
│  TemplateController::overridePageTemplate()     ← Plugin hooks filter       │
│       │  Checks: views/page-my-documents.php exists?                        │
│       ▼                                                                     │
│  render-view.php                                                            │
│       │  include('page-my-documents.php')                                   │
│       ▼                                                                     │
│  page-my-documents.php                                                      │
│       │  get_header() ──────────────────────────► header.php (PATCHED)      │
│       │                                           └── Reads manifest.json   │
│       │                                           └── <link href="app.css"> │
│       │                                                                     │
│       │  <div class="max-w-3xl bg-blue-600">     ← Tailwind classes work!   │
│       │                                                                     │
│       │  get_footer() ──────────────────────────► footer.php (PATCHED)      │
│       ▼                                           └── wp_footer()           │
│  Rendered HTML with styled content                └── </body></html>        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Files in reportburster-integration Plugin

| File | Role |
|------|------|
| `plugin/Providers/AppServiceProvider.php` | Creates `/my-documents/` page on init, registers hooks |
| `plugin/Http/Controllers/TemplateController.php` | Hooks `page_template` and `single_template` filters |
| `bootstrap/render-view.php` | Includes the matching PHP template from `resources/views/` |
| `resources/views/page-*.php` | Page templates (e.g., `page-my-documents.php`) |
| `resources/views/single-*.php` | Single post templates (e.g., `single-paystub.php`) |

---

## Troubleshooting

### CSS not loading / Tailwind classes not working
1. Check if manifest exists: `wp-themes/reportburster-sage/public/build/manifest.json`
2. Force rebuild: `$env:FORCE_BUILD="true"; docker compose up -d sage-theme-builder`
3. Check build logs: `docker compose logs sage-theme-builder`

### Page shows 404
1. Verify page exists in WP Admin → Pages
2. Flush permalinks: WP Admin → Settings → Permalinks → Save

### Plugin template not loading
1. Check file exists: `wp-plugins/.../resources/views/page-{slug}.php`
2. Verify plugin is active: `docker compose exec cms-webportal-playground wp plugin list`

### Container won't start
```powershell
# Check logs
docker compose logs cms-webportal-playground-cli

# Reset everything (WARNING: deletes data)
docker compose down -v
docker compose up -d
```

---

## Services

| Service | Container | Purpose |
|---------|-----------|---------|
| `cms-webportal-playground` | rb-cms-webportal-playground | WordPress + Apache |
| `cms-webportal-playground-db` | rb-cms-webportal-playground-db | MySQL 8.0 |
| `cms-webportal-playground-cli` | rb-cms-webportal-playground-cli | WP-CLI provisioning |
| `sage-theme-builder` | rb-sage-theme-builder | Node.js for Vite/Tailwind build |
