<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title><g:layoutTitle default="FlowKraft"/></title>

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='m22 2-7 20-4-9-9-4Z' fill='%2322a7c8'/></svg>" type="image/svg+xml"/>

    <!-- Apply theme immediately to prevent flash - load from SQLite via API -->
    <script>
        (function() {
            // Try to load from SQLite first, fallback to localStorage for initial render
            const cachedTheme = localStorage.getItem('rb-theme') || 'light';
            document.documentElement.setAttribute('data-bs-theme', cachedTheme);
            
            // Then fetch from SQLite and update if different
            fetch('/settings?key=theme.mode')
                .then(r => r.json())
                .then(data => {
                    if (data.value && data.value !== cachedTheme) {
                        document.documentElement.setAttribute('data-bs-theme', data.value);
                        localStorage.setItem('rb-theme', data.value); // cache it
                        updateThemeIcon && updateThemeIcon(data.value);
                    }
                })
                .catch(() => {}); // ignore errors, use cached
        })();
    </script>

    <!-- Google Fonts - Roboto -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">

    <!-- AdminLTE v4 CSS (Bootstrap 5 included) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-beta3/dist/css/adminlte.min.css"/>
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>

    <style>
        :root {
            --rb-cyan: #22a7c8;
            --rb-dark: #1a2332;
            --rb-gray: #6b7280;
            --rb-light-gray: #f8fafc;
        }
        
        [data-bs-theme="dark"] {
            --bs-body-bg: #0f172a;
            --bs-body-color: #e2e8f0;
            --bs-tertiary-bg: #1e293b;
            --bs-border-color: #334155;
        }
        
        body { 
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            font-size: 14px;
            background: #f8fafc;
        }
        
        [data-bs-theme="dark"] body {
            background: #0f172a;
        }

        /* ===== TOP NAVIGATION ===== */
        .portal-navbar {
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
            padding: 0 1.5rem;
            height: 64px;
        }
        
        [data-bs-theme="dark"] .portal-navbar {
            background: #1e293b;
            border-bottom-color: #334155;
        }
        
        .portal-navbar .navbar-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            color: #1e293b;
        }
        
        [data-bs-theme="dark"] .portal-navbar .navbar-brand {
            color: #f1f5f9;
        }
        
        .brand-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #22a7c8 0%, #0891b2 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(34, 167, 200, 0.3);
        }
        
        .brand-icon i {
            color: #fff;
            font-size: 1.1rem;
        }
        
        .portal-navbar .nav-link {
            color: #64748b;
            font-weight: 500;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: all 0.15s ease;
        }
        
        .portal-navbar .nav-link:hover {
            color: #1e293b;
            background: #f1f5f9;
        }
        
        .portal-navbar .nav-link.active {
            color: #22a7c8;
            background: rgba(34, 167, 200, 0.1);
        }
        
        [data-bs-theme="dark"] .portal-navbar .nav-link {
            color: #94a3b8;
        }
        
        [data-bs-theme="dark"] .portal-navbar .nav-link:hover {
            color: #f1f5f9;
            background: #334155;
        }
        
        [data-bs-theme="dark"] .portal-navbar .nav-link.active {
            color: #22a7c8;
            background: rgba(34, 167, 200, 0.15);
        }

        /* Theme Toggle Button */
        .theme-toggle {
            background: transparent;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.5rem;
            cursor: pointer;
            color: #64748b;
            transition: all 0.15s ease;
        }
        
        .theme-toggle:hover {
            background: #f1f5f9;
            color: #1e293b;
        }
        
        [data-bs-theme="dark"] .theme-toggle {
            border-color: #334155;
            color: #94a3b8;
        }
        
        [data-bs-theme="dark"] .theme-toggle:hover {
            background: #334155;
            color: #f1f5f9;
        }

        /* ===== MAIN CONTENT ===== */
        .portal-content {
            min-height: calc(100vh - 64px - 60px);
            padding: 2rem 0;
        }

        /* ===== HERO SECTION ===== */
        .hero-section {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 4rem 0;
            text-align: center;
            color: #fff;
            position: relative;
            overflow: hidden;
        }
        
        .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(ellipse at top, rgba(34, 167, 200, 0.15) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .hero-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .hero-subtitle {
            font-size: 1.1rem;
            color: #94a3b8;
            max-width: 600px;
            margin: 0 auto 2rem;
        }

        /* ===== CARDS ===== */
        .card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
        }
        
        .card:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        [data-bs-theme="dark"] .card {
            background: #1e293b;
            border-color: #334155;
        }
        
        .card-header {
            background: transparent;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 1.25rem;
            font-weight: 600;
        }
        
        [data-bs-theme="dark"] .card-header {
            border-bottom-color: #334155;
        }

        /* ===== DOCUMENT CARDS ===== */
        .document-card {
            padding: 1.25rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #fff;
            transition: all 0.2s ease;
        }
        
        .document-card:hover {
            border-color: #22a7c8;
            box-shadow: 0 4px 12px rgba(34, 167, 200, 0.15);
        }
        
        [data-bs-theme="dark"] .document-card {
            background: #1e293b;
            border-color: #334155;
        }
        
        [data-bs-theme="dark"] .document-card:hover {
            border-color: #22a7c8;
        }
        
        .document-card-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
        }
        
        .document-card-icon.payslip {
            background: rgba(34, 167, 200, 0.1);
            color: #22a7c8;
        }
        
        .document-card-icon.invoice {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
        }

        /* ===== BUTTONS ===== */
        .btn-cyan {
            background: linear-gradient(135deg, #22a7c8 0%, #0891b2 100%);
            border: none;
            color: #fff;
            box-shadow: 0 2px 4px rgba(34, 167, 200, 0.3);
        }
        
        .btn-cyan:hover {
            background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
            color: #fff;
            transform: translateY(-1px);
        }
        
        .btn-outline-cyan {
            border: 1px solid #22a7c8;
            color: #22a7c8;
            background: transparent;
        }
        
        .btn-outline-cyan:hover {
            background: #22a7c8;
            color: #fff;
        }

        /* ===== TABLES ===== */
        .table {
            margin-bottom: 0;
        }
        
        .table thead th {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            color: #64748b;
            font-weight: 600;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.02em;
            padding: 0.875rem 1rem;
        }
        
        [data-bs-theme="dark"] .table thead th {
            background: rgba(0, 0, 0, 0.2);
            border-bottom-color: #334155;
            color: #94a3b8;
        }
        
        .table tbody td {
            padding: 0.875rem 1rem;
            vertical-align: middle;
            border-bottom: 1px solid #f1f5f9;
        }
        
        [data-bs-theme="dark"] .table tbody td {
            border-bottom-color: #334155;
        }

        /* ===== FOOTER ===== */
        .portal-footer {
            background: #fff;
            border-top: 1px solid #e2e8f0;
            padding: 1rem 0;
            text-align: center;
            color: #64748b;
            font-size: 0.875rem;
        }
        
        [data-bs-theme="dark"] .portal-footer {
            background: #1e293b;
            border-top-color: #334155;
            color: #94a3b8;
        }

        /* ===== BADGES ===== */
        .badge {
            font-weight: 500;
            padding: 0.35em 0.65em;
            border-radius: 6px;
        }

        /* ===== FORMS ===== */
        .form-control, .form-select {
            border-radius: 8px;
            border-color: #e2e8f0;
            padding: 0.5rem 0.875rem;
        }
        
        .form-control:focus, .form-select:focus {
            border-color: #22a7c8;
            box-shadow: 0 0 0 3px rgba(34, 167, 200, 0.15);
        }
        
        [data-bs-theme="dark"] .form-control,
        [data-bs-theme="dark"] .form-select {
            background: #1e293b;
            border-color: #334155;
            color: #e2e8f0;
        }
    </style>

    <g:layoutHead/>
</head>
<body>

    <!-- Top Navigation -->
    <nav class="navbar navbar-expand-lg portal-navbar sticky-top">
        <div class="container">
            <a class="navbar-brand" href="${createLink(controller: 'home', action: 'index')}">
                <div class="brand-icon">
                    <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <span>FlowKraft</span>
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#portalNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="portalNav">
                <ul class="navbar-nav me-auto ms-4">
                    <li class="nav-item">
                        <a class="nav-link ${controllerName == 'home' ? 'active' : ''}" 
                           href="${createLink(controller: 'home', action: 'index')}">
                            <i class="bi bi-house me-1"></i> Home
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${controllerName == 'portalPayslip' ? 'active' : ''}" 
                           href="${createLink(controller: 'portalPayslip', action: 'index')}">
                            <i class="bi bi-receipt me-1"></i> My Payslips
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link ${controllerName == 'portalInvoice' ? 'active' : ''}" 
                           href="${createLink(controller: 'portalInvoice', action: 'index')}">
                            <i class="bi bi-file-text me-1"></i> My Invoices
                        </a>
                    </li>
                </ul>
                
                <div class="d-flex align-items-center gap-3">
                    <button type="button" class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
                        <i class="bi bi-moon" id="themeIcon"></i>
                    </button>
                    
                    <a href="${createLink(controller: 'admin', action: 'index')}" class="btn btn-sm btn-outline-cyan">
                        <i class="bi bi-shield-lock me-1"></i> Admin
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="portal-content">
        <g:layoutBody/>
    </main>

    <!-- Footer -->
    <footer class="portal-footer">
        <div class="container">
            <p class="mb-0">&copy; ${new Date().format('yyyy')} FlowKraft. All rights reserved.</p>
        </div>
    </footer>

    <!-- Bootstrap Bundle JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- AdminLTE JS -->
    <script src="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-beta3/dist/js/adminlte.min.js"></script>

    <!-- Theme Toggle Script - saves to SQLite via API -->
    <script>
        async function toggleTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Update UI immediately
            html.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('rb-theme', newTheme); // cache locally
            updateThemeIcon(newTheme);
            
            // Save to SQLite via API
            try {
                await fetch('/settings/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        key: 'theme.mode', 
                        value: newTheme, 
                        category: 'theme' 
                    })
                });
            } catch (e) {
                console.error('Failed to save theme to database:', e);
            }
        }
        
        function updateThemeIcon(theme) {
            const icon = document.getElementById('themeIcon');
            if (icon) {
                icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
            }
        }
        
        // Initialize theme icon on load
        document.addEventListener('DOMContentLoaded', function() {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            updateThemeIcon(currentTheme);
        });
    </script>

    <g:layoutFooter/>
</body>
</html>
