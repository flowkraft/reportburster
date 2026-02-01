<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title><g:layoutTitle default="ReportBurster Dashboard"/></title>
    
    <!-- Favicon - ReportBurster paper plane icon -->
    <link rel="icon" type="image/svg+xml" href="${assetPath(src: 'favicon.svg')}"/>
    <link rel="shortcut icon" type="image/svg+xml" href="${assetPath(src: 'favicon.svg')}"/>
    
    <!-- Apply theme immediately to prevent flash -->
    <script>
        (function() {
            const savedTheme = localStorage.getItem('rb-theme') || 'light';
            document.documentElement.setAttribute('data-bs-theme', savedTheme);
        })();
    </script>
    
    <!-- ReportBurster configuration (api-key.txt auto-discovery with '123' fallback for dev) -->
    <%@ page import="flowkraft.frend.RbUtils" %>
    <script>
        window.rbConfig = {
            apiBaseUrl: '${RbUtils.apiBaseUrl}',
            apiKey: '${RbUtils.apiKey}'
        };
    </script> 
    
    <!-- Google Fonts - Inter for clean professional look -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- AdminLTE v4 CSS (Bootstrap 5 included) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-beta3/dist/css/adminlte.min.css"/>
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"/>
    
    <style>
        /* ReportBurster brand - clean, professional */
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
        
        /* Top-nav layout */
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
        
        /* Brand */
        .navbar-brand {
            font-weight: 700;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--rb-dark);
        }
        .navbar-brand .brand-icon {
            color: #29a0d6;
            width: 22px;
            height: 22px;
        }
        [data-bs-theme="dark"] .navbar-brand {
            color: #fff;
        }
        
        /* Nav links - subtle, professional */
        .navbar-nav .nav-link {
            color: var(--rb-gray);
            font-weight: 500;
            font-size: 0.9rem;
            padding: 0.5rem 1rem !important;
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
            padding: 2rem 0;
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
        
        /* Footer */
        .app-footer {
            background: var(--rb-light-gray);
            border-top: 1px solid #e5e7eb;
            color: var(--rb-gray);
            font-size: 0.875rem;
        }
        [data-bs-theme="dark"] .app-footer {
            background: #0f172a;
            border-top-color: #334155;
            color: #94a3b8;
        }
        
        /* Placeholder containers */
        .placeholder-container {
            background: var(--rb-light-gray);
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 3rem;
            text-align: center;
            color: var(--rb-gray);
        }
        [data-bs-theme="dark"] .placeholder-container {
            background: #1e293b;
            border-color: #374151;
        }
    </style>
    
    <g:layoutHead/>
</head>
<body class="layout-top-nav">
    <div class="app-wrapper">
        
        <!-- Header / Top Navbar -->
        <nav class="app-header navbar navbar-expand-lg navbar-light">
            <div class="container-fluid">
                <!-- Brand -->
                <a class="navbar-brand" href="${createLink(uri: '/')}">
                    <svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m22 2-7 20-4-9-9-4Z"/>
                        <path d="M22 2 11 13"/>
                    </svg>
                    ReportBurster
                </a>
                
                <!-- Navbar toggler -->
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                
                <!-- Navigation -->
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item">
                            <g:link uri="/" class="nav-link ${controllerName == 'home' || !controllerName ? 'active' : ''}">
                                Home
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link controller="tabulator" class="nav-link ${controllerName == 'tabulator' ? 'active' : ''}">
                                Tabulator
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link controller="charts" class="nav-link ${controllerName == 'charts' ? 'active' : ''}">
                                Charts
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/pivottables" class="nav-link ${controllerName == 'pivotTables' ? 'active' : ''}">
                                Pivot Tables
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/report-parameters" class="nav-link ${controllerName == 'reportParameters' ? 'active' : ''}">
                                Parameters
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link controller="reports" class="nav-link ${controllerName == 'reports' ? 'active' : ''}">
                                Reports
                            </g:link>
                        </li>
                        <li class="nav-item">
                            <g:link uri="/your-canvas" class="nav-link ${controllerName == 'yourCanvas' ? 'active' : ''}">
                                Your Canvas
                            </g:link>
                        </li>
                    </ul>
                    
                    <!-- Theme Toggle -->
                    <ul class="navbar-nav">
                        <li class="nav-item dropdown">
                            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
                                <i class="bi bi-circle-half"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="setTheme('light')"><i class="bi bi-sun me-2"></i>Light</a></li>
                                <li><a class="dropdown-item" href="#" onclick="setTheme('dark')"><i class="bi bi-moon me-2"></i>Dark</a></li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main class="app-main">
            <div class="app-content">
                <div class="container-fluid">
                    <g:layoutBody/>
                </div>
            </div>
        </main>
        
        <!-- Footer -->
        <footer class="app-footer">
            <div class="float-end d-none d-sm-inline">
                <a href="https://www.reportburster.com" target="_blank" class="text-decoration-none text-muted">reportburster.com</a>
            </div>
            <span>&copy; 2025 FlowKraft Systems</span>
        </footer>
    </div>

    <!-- Bootstrap 5 JS (required for dropdowns, etc.) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- AdminLTE v4 JS -->
    <script src="https://cdn.jsdelivr.net/npm/admin-lte@4.0.0-beta3/dist/js/adminlte.min.js"></script>
    <!-- HTMX -->
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    
    <script>
        function setTheme(theme) {
            document.documentElement.setAttribute('data-bs-theme', theme);
            localStorage.setItem('rb-theme', theme);
        }
    </script>
    
    <script src="http://localhost:9090/rb-webcomponents/rb-webcomponents.umd.js"></script>
    <g:pageProperty name="page.scripts"/>
</body>
</html>
