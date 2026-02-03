<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title><g:layoutTitle default="Admin Panel - FlowKraft"/></title>

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='m22 2-7 20-4-9-9-4Z' fill='%2322a7c8'/></svg>" type="image/svg+xml"/>

    <!-- Apply theme immediately to prevent flash - load from SQLite via API -->
    <script>
        (function() {
            // Try to load from SQLite first, fallback to localStorage for initial render
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

    <!-- Google Fonts - Inter (matches Next.js) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

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
            --sidebar-width: 256px;
        }
        
        [data-bs-theme="dark"] {
            --bs-body-bg: #0f172a;
            --bs-body-color: #e2e8f0;
            --bs-tertiary-bg: #1e293b;
            --bs-border-color: #334155;
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            font-size: 14px;
            background: #f1f5f9;
        }
        
        [data-bs-theme="dark"] body {
            background: #0f172a;
        }

        /* ===== ADMIN SIDEBAR ===== */
        .admin-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: var(--sidebar-width);
            height: 100vh;
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
            border-right: 1px solid #334155;
            z-index: 1030;
            display: flex;
            flex-direction: column;
        }

        /* Sidebar Header/Logo */
        .sidebar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid #334155;
            height: 64px;
        }
        
        .sidebar-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        
        .sidebar-brand-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #22a7c8 0%, #0891b2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(34, 167, 200, 0.3);
        }
        
        .sidebar-brand-icon i {
            color: #fff;
            font-size: 1rem;
        }
        
        .sidebar-brand-text {
            color: #fff;
            font-weight: 600;
            font-size: 1.1rem;
        }

        /* Sidebar Navigation */
        .sidebar-nav {
            flex: 1;
            padding: 1rem 0.75rem;
            overflow-y: auto;
        }
        
        .sidebar-nav-header {
            color: #64748b;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.75rem 0.75rem 0.5rem;
            margin-top: 0.5rem;
        }
        
        .sidebar-nav-item {
            margin-bottom: 2px;
        }
        
        .sidebar-nav-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.65rem 0.75rem;
            color: #94a3b8;
            text-decoration: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.15s ease;
            position: relative;
        }
        
        .sidebar-nav-link:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #e2e8f0;
        }
        
        .sidebar-nav-link.active {
            background: linear-gradient(90deg, rgba(34, 167, 200, 0.15) 0%, rgba(34, 167, 200, 0.05) 100%);
            color: #22a7c8;
        }
        
        .sidebar-nav-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 8px;
            bottom: 8px;
            width: 3px;
            background: #22a7c8;
            border-radius: 0 3px 3px 0;
        }
        
        .sidebar-nav-link i {
            font-size: 1.1rem;
            width: 20px;
            text-align: center;
            color: #64748b;
        }
        
        .sidebar-nav-link.active i,
        .sidebar-nav-link:hover i {
            color: inherit;
        }

        /* Sidebar Footer */
        .sidebar-footer {
            padding: 0.75rem;
            border-top: 1px solid #334155;
            background: rgba(0, 0, 0, 0.2);
        }
        
        .sidebar-footer-link {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0.65rem 0.75rem;
            color: #94a3b8;
            text-decoration: none;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: all 0.15s ease;
        }
        
        .sidebar-footer-link:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #e2e8f0;
        }
        
        .sidebar-footer-icon {
            width: 32px;
            height: 32px;
            background: #334155;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .sidebar-footer-icon i {
            color: #94a3b8;
            font-size: 0.9rem;
        }

        /* ===== MAIN CONTENT AREA ===== */
        .admin-wrapper {
            margin-left: var(--sidebar-width);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Admin Header */
        .admin-header {
            position: sticky;
            top: 0;
            z-index: 1020;
            background: #fff;
            border-bottom: 1px solid #e2e8f0;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
        }
        
        [data-bs-theme="dark"] .admin-header {
            background: #1e293b;
            border-bottom-color: #334155;
        }
        
        .admin-header-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
        }
        
        [data-bs-theme="dark"] .admin-header-title {
            color: #f1f5f9;
        }
        
        .admin-header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
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

        /* Main Content */
        .admin-content {
            flex: 1;
            padding: 1.5rem;
        }

        /* ===== CARDS ===== */
        .card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        [data-bs-theme="dark"] .card {
            background: #1e293b;
            border-color: #334155;
        }
        
        .card-header {
            background: transparent;
            border-bottom: 1px solid #e2e8f0;
            padding: 1rem 1.25rem;
        }
        
        [data-bs-theme="dark"] .card-header {
            border-bottom-color: #334155;
        }

        /* ===== STATS CARDS ===== */
        .stat-card {
            border-radius: 12px;
            padding: 1.25rem;
            transition: all 0.2s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .stat-card-icon.cyan { background: rgba(34, 167, 200, 0.1); color: #22a7c8; }
        .stat-card-icon.violet { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .stat-card-icon.emerald { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .stat-card-icon.amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        
        .stat-card-value {
            font-size: 1.75rem;
            font-weight: 700;
            color: #1e293b;
            margin: 0.5rem 0 0.25rem;
        }
        
        [data-bs-theme="dark"] .stat-card-value {
            color: #f1f5f9;
        }
        
        .stat-card-label {
            color: #64748b;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .stat-card-trend {
            font-size: 0.75rem;
            margin-top: 0.25rem;
        }
        
        .stat-card-trend.positive { color: #10b981; }
        .stat-card-trend.negative { color: #ef4444; }

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
        
        .table tbody tr:hover {
            background: #f8fafc;
        }
        
        [data-bs-theme="dark"] .table tbody tr:hover {
            background: rgba(255, 255, 255, 0.02);
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
        
        .btn-violet {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            border: none;
            color: #fff;
        }
        
        .btn-violet:hover {
            background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            color: #fff;
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
        
        .form-label {
            font-weight: 500;
            color: #475569;
            margin-bottom: 0.375rem;
        }
        
        [data-bs-theme="dark"] .form-label {
            color: #cbd5e1;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 991.98px) {
            .admin-sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .admin-sidebar.show {
                transform: translateX(0);
            }
            
            .admin-wrapper {
                margin-left: 0;
            }
        }
    </style>

    <g:layoutHead/>
</head>
<body>

    <!-- Admin Sidebar -->
    <aside class="admin-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
            <a href="${createLink(controller: 'admin', action: 'index')}" class="sidebar-brand">
                <div class="sidebar-brand-icon">
                    <i class="bi bi-lightning-charge-fill"></i>
                </div>
                <span class="sidebar-brand-text">Admin</span>
            </a>
        </div>

        <!-- Sidebar Navigation -->
        <nav class="sidebar-nav">
            <div class="sidebar-nav-header">Menu</div>
            
            <div class="sidebar-nav-item">
                <a href="${createLink(controller: 'admin', action: 'index')}" 
                   class="sidebar-nav-link ${controllerName == 'admin' && actionName == 'index' ? 'active' : ''}">
                    <i class="bi bi-grid-1x2"></i>
                    <span>Dashboard</span>
                </a>
            </div>
            
            <div class="sidebar-nav-item">
                <a href="${createLink(controller: 'payslip', action: 'index')}" 
                   class="sidebar-nav-link ${controllerName == 'payslip' ? 'active' : ''}">
                    <i class="bi bi-receipt"></i>
                    <span>Payslips</span>
                </a>
            </div>
            
            <div class="sidebar-nav-item">
                <a href="${createLink(controller: 'invoice', action: 'index')}" 
                   class="sidebar-nav-link ${controllerName == 'invoice' ? 'active' : ''}">
                    <i class="bi bi-file-text"></i>
                    <span>Invoices</span>
                </a>
            </div>
            
            <div class="sidebar-nav-item">
                <a href="${createLink(controller: 'admin', action: 'settings')}" 
                   class="sidebar-nav-link ${controllerName == 'admin' && actionName == 'settings' ? 'active' : ''}">
                    <i class="bi bi-gear"></i>
                    <span>Settings</span>
                </a>
            </div>
        </nav>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
            <a href="${createLink(controller: 'home', action: 'index')}" class="sidebar-footer-link">
                <div class="sidebar-footer-icon">
                    <i class="bi bi-arrow-left"></i>
                </div>
                <span>Back to App</span>
            </a>
        </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="admin-wrapper">
        <!-- Admin Header -->
        <header class="admin-header">
            <h1 class="admin-header-title">
                <g:pageProperty name="page.title" default="Dashboard"/>
            </h1>
            <div class="admin-header-actions">
                <button type="button" class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">
                    <i class="bi bi-moon" id="themeIcon"></i>
                </button>
            </div>
        </header>

        <!-- Main Content -->
        <main class="admin-content">
            <g:layoutBody/>
        </main>
    </div>

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
            if (newTheme === 'dark') {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
            localStorage.setItem('rb-theme', newTheme);
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

    <g:pageProperty name="page.scripts"/>
</body>
</html>
