<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title><g:layoutTitle default="ReportBurster - Dashboards & Self Service Portals"/></title>
    
    <!-- Favicon - ReportBurster paper plane icon -->
    <link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='m22 2-7 20-4-9-9-4Z' fill='%2322a7c8'/></svg>" type="image/svg+xml"/>
    
    <!-- Apply theme immediately to prevent flash - Load from SQLite -->
    <script>
        (function() {
            const cachedTheme = localStorage.getItem('rb-theme') || 'light';
            document.documentElement.setAttribute('data-bs-theme', cachedTheme);
            if (cachedTheme === 'dark') {
                document.documentElement.classList.add('dark');
            }
            
            // Then fetch from SQLite and update if different
            fetch('/settings?key=theme.mode')
                .then(r => r.json())
                .then(data => {
                    if (data.value && data.value !== cachedTheme) {
                        document.documentElement.setAttribute('data-bs-theme', data.value);
                        if (data.value === 'dark') {
                            document.documentElement.classList.add('dark');
                        } else {
                            document.documentElement.classList.remove('dark');
                        }
                        localStorage.setItem('rb-theme', data.value);
                        updateThemeIcon && updateThemeIcon(data.value);
                    }
                })
                .catch(() => {});
        })();
    </script>
    
    <!-- ReportBurster configuration -->
    <%@ page import="flowkraft.frend.RbUtils" %>
    <script>
        window.rbConfig = {
            apiBaseUrl: '${RbUtils.apiBaseUrl}',
            apiKey: '${RbUtils.apiKey}'
        };
    </script>
    
    <!-- Google Fonts - Inter for clean professional look (matches Next.js) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- AdminLTE v4 CSS (Bootstrap 5 included) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-beta3/dist/css/adminlte.min.css"/>
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
    
    <style>
        /* ReportBurster brand - matches Next.js theme */
        :root {
            --rb-cyan: #22a7c8;
            --rb-dark: #1a2332;
            --rb-gray: #6b7280;
            --rb-light-gray: #f8fafc;
        }
        
        /* Dark theme overrides */
        [data-bs-theme="dark"] {
            --bs-body-bg: #0f172a;
            --bs-body-color: #e2e8f0;
            --bs-tertiary-bg: #1e293b;
            --bs-border-color: #334155;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        /* Fixed Top Navbar - matches Next.js */
        .app-wrapper {
            margin-left: 0 !important;
            padding-top: 64px;
        }
        
        .app-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1030;
            background: #fff !important;
            border-bottom: 1px solid #e5e7eb;
            height: 64px;
        }
        
        [data-bs-theme="dark"] .app-header {
            background: #0f172a !important;
            border-bottom-color: #334155;
        }
        
        /* Brand - matches Next.js */
        .navbar-brand {
            font-weight: 700;
            font-size: 1.125rem;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--rb-dark);
            text-decoration: none;
        }
        
        .navbar-brand .brand-icon {
            color: var(--rb-cyan);
            width: 20px;
            height: 20px;
        }
        
        [data-bs-theme="dark"] .navbar-brand {
            color: #fff;
        }
        
        /* Nav links - subtle, professional, matches Next.js */
        .navbar-nav .nav-link {
            color: var(--rb-gray);
            font-weight: 500;
            font-size: 0.875rem;
            padding: 0.5rem 1rem !important;
            transition: color 0.15s ease;
        }
        
        .navbar-nav .nav-link:hover {
            color: var(--rb-dark);
        }
        
        .navbar-nav .nav-link.active {
            color: var(--rb-cyan);
        }
        
        [data-bs-theme="dark"] .navbar-nav .nav-link {
            color: #9ca3af;
        }
        
        [data-bs-theme="dark"] .navbar-nav .nav-link:hover {
            color: #fff;
        }
        
        [data-bs-theme="dark"] .navbar-nav .nav-link.active {
            color: var(--rb-cyan);
        }
        
        /* Content area */
        .app-content {
            padding: 0;
        }
        
        .app-content-inner {
            width: 100%;
            padding: 2rem 1rem;
        }
        
        /* Cards - clean, minimal */
        .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .card-header {
            background: transparent;
            border-bottom: 1px solid #e5e7eb;
            font-weight: 600;
        }
        
        [data-bs-theme="dark"] .card {
            border-color: #334155;
            background: #1e293b;
        }
        
        [data-bs-theme="dark"] .card-header {
            border-bottom-color: #334155;
        }
        
        /* Footer - matches Next.js */
        .app-footer {
            background: var(--rb-light-gray);
            border-top: 1px solid #e5e7eb;
            color: var(--rb-gray);
            font-size: 0.875rem;
            padding: 1rem 0;
        }
        
        [data-bs-theme="dark"] .app-footer {
            background: #0f172a;
            border-top-color: #334155;
            color: #94a3b8;
        }
        
        /* Admin button in navbar */
        .btn-admin {
            background: linear-gradient(135deg, #22a7c8 0%, #0891b2 100%);
            color: white;
            font-weight: 500;
            font-size: 0.875rem;
            padding: 0.375rem 0.75rem;
            border-radius: 6px;
            border: none;
            text-decoration: none;
            transition: transform 0.15s, box-shadow 0.15s;
        }
        
        .btn-admin:hover {
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(34, 167, 200, 0.4);
        }
        
        /* Theme toggle button */
        .theme-toggle {
            background: transparent;
            border: none;
            padding: 0.5rem;
            color: var(--rb-gray);
            cursor: pointer;
            transition: color 0.15s;
        }
        
        .theme-toggle:hover {
            color: var(--rb-dark);
        }
        
        [data-bs-theme="dark"] .theme-toggle {
            color: #9ca3af;
        }
        
        [data-bs-theme="dark"] .theme-toggle:hover {
            color: #fff;
        }
    </style>
    
    <g:layoutHead/>
</head>
<body class="layout-top-nav">
    <div class="app-wrapper">
        
        <!-- Header / Top Navbar - matches Next.js exactly -->
        <nav class="app-header navbar navbar-expand-lg navbar-light">
            <div class="container-fluid px-4">
                <!-- Brand -->
                <a class="navbar-brand" href="${createLink(uri: '/')}">
                    <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z"/>
                        <path d="M22 2 11 13"/>
                    </svg>
                    ReportBurster
                </a>
                
                <!-- Navbar toggler for mobile -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Navigation - matches Next.js navLinks exactly -->
                <div class="collapse navbar-collapse" id="mainNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <g:link uri="/" class="nav-link ${controllerName == 'home' || !controllerName ? 'active' : ''}">
                                Home
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/tabulator" class="nav-link ${controllerName == 'tabulator' ? 'active' : ''}">
                                Tabulator
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/charts" class="nav-link ${controllerName == 'charts' ? 'active' : ''}">
                                Charts
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/pivot-tables" class="nav-link ${controllerName == 'pivotTables' ? 'active' : ''}">
                                Pivot Tables
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/report-parameters" class="nav-link ${controllerName == 'reportParameters' ? 'active' : ''}">
                                Parameters
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/reports" class="nav-link ${controllerName == 'reports' ? 'active' : ''}">
                                Reports
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/data-warehouse" class="nav-link ${controllerName == 'dataWarehouse' ? 'active' : ''}">
                                Data Warehouse
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/your-canvas" class="nav-link ${controllerName == 'yourCanvas' ? 'active' : ''}">
                                Your Canvas
                            </g:link>
                        </li>
                    </ul>
                    
                    <!-- Right side: Admin link + Theme toggle -->
                    <ul class="navbar-nav align-items-center">
                        <li class="nav-item me-2">
                            <a href="${createLink(uri: '/admin')}" class="btn-admin">
                                <i class="bi bi-gear me-1"></i> Admin
                            </a>
                        </li>
                        <li class="nav-item">
                            <button type="button" class="theme-toggle" onclick="toggleTheme()" title="Toggle theme" id="mainThemeToggle">
                                <i class="bi bi-moon fs-5" id="mainThemeIcon"></i>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main class="app-main">
            <div class="app-content">
                <div class="app-content-inner">
                    <g:layoutBody/>
                </div>
            </div>
        </main>
        
        <!-- Footer - matches Next.js -->
        <footer class="app-footer">
            <div class="container-fluid px-4 d-flex justify-content-between align-items-center">
                <span>&copy; 2025 FlowKraft Systems</span>
                <a href="https://www.reportburster.com" target="_blank" class="text-decoration-none text-muted">
                    reportburster.com
                </a>
            </div>
        </footer>
    </div>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- AdminLTE v4 JS -->
    <script src="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-beta3/dist/js/adminlte.min.js"></script>
    <!-- HTMX -->
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    
    <script>
        async function toggleTheme() {
            const html = document.documentElement;
            const current = html.getAttribute('data-bs-theme') || 'light';
            const next = current === 'light' ? 'dark' : 'light';
            
            // Update UI immediately
            html.setAttribute('data-bs-theme', next);
            if (next === 'dark') {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
            localStorage.setItem('rb-theme', next);
            updateThemeIcon(next);
            
            // Save to SQLite via API
            try {
                await fetch('/settings/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        key: 'theme.mode', 
                        value: next, 
                        category: 'theme' 
                    })
                });
            } catch (e) {
                console.error('Failed to save theme to database:', e);
            }
        }
        
        function updateThemeIcon(theme) {
            const icon = document.getElementById('mainThemeIcon');
            if (icon) {
                icon.className = theme === 'dark' ? 'bi bi-sun fs-5' : 'bi bi-moon fs-5';
            }
        }
        
        // Initialize theme icon on load
        document.addEventListener('DOMContentLoaded', function() {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
            updateThemeIcon(currentTheme);
        });
    </script>
    
    <!-- ReportBurster Web Components -->
    <script src="http://localhost:9090/rb-webcomponents/rb-webcomponents.umd.js"></script>
    
    <g:pageProperty name="page.scripts"/>
</body>
</html>
