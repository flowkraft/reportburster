<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title><g:layoutTitle default="FlowKraft Admin Panel"/></title>

    <!-- Favicon: FlowKraft mark (SVG data URI) -->
    <link rel="icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='m22 2-7 20-4-9-9-4Z' fill='%2322a7c8'/></svg>" type="image/svg+xml"/>
    <link rel="shortcut icon" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='m22 2-7 20-4-9-9-4Z' fill='%2322a7c8'/></svg>" type="image/svg+xml"/>

    <!-- Apply theme immediately to prevent flash -->
    <script>
        (function() {
            const savedTheme = localStorage.getItem('rb-theme') || 'light';
            document.documentElement.setAttribute('data-bs-theme', savedTheme);
        })();
    </script>

    <!-- Google Fonts - Roboto (professional, compact) -->
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
        body { font-family: 'Roboto', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; }
        /* Sidebar typography */
        .nav-sidebar .nav-link { font-size: .95rem; }
        .brand-text { font-size: 1rem }

        /* Header brand */
        .brand-text { font-weight:700; font-size:1.05rem; }
        .brand-icon { width:22px; height:22px; display:inline-block; vertical-align:middle }
        .brand-link { display:flex; align-items:center; gap:8px; padding: .2rem 1rem; height:48px; }
        .brand-text { color:#fff; margin-left:4px; text-decoration:none }
        .brand-link:hover { text-decoration:none }
        /* Reduce gap below brand */
        .main-sidebar .brand-link + .mt-2 { margin-top: 0.25rem }
        .nav-header { padding: .5rem 1rem; font-size: .8rem; color: #6b7280; }
        /* nav link layout */
        .nav-sidebar .nav-link { display:flex; align-items:center }
        .nav-sidebar .nav-link .nav-icon { margin-right: .6rem }


        /* Sidebar tweaks (compact, brand-aligned) */
        .main-sidebar { background: linear-gradient(180deg,#0b1220,#0f172a); position: fixed; top: 0; left: 0; height: 100vh; width: 240px; z-index:1030; padding-top: 48px; }
        .user-panel .image svg, .user-panel .image img { width:40px; height:40px; border-radius:50%; }
        .user-panel .info a { color: #cbd5e1; font-weight:600 }
        .nav-sidebar .nav-link { padding: .45rem 1rem; position: relative; color: #9fb0c3; font-size: .92rem }
        .nav-sidebar .nav-link p { margin: 0; }        .nav-sidebar .nav-link:hover { background-color: rgba(255,255,255,0.02); }
        .nav-sidebar .nav-link.active { 
            background-color: transparent;
            color: var(--rb-cyan) !important;
        }
        .nav-sidebar .nav-link.active::before {
            content: '';
            position: absolute;
            left: 0;
            top: 8px;
            bottom: 8px;
            width: 4px;
            background: var(--rb-cyan);
            border-radius: 0 4px 4px 0;
        }
        .nav-sidebar .nav-link .nav-icon { width:20px; font-size:1.05rem; color: #94a3b8; margin-right: .75rem; }

        /* Header styling */
        .main-header.navbar { background: transparent; border-bottom: 0; position: fixed; left: 240px; right: 0; z-index:1040; height:48px }
        .brand-link { color: #fff; }
        .brand-text { color: #fff; }

        /* Content layout fixes to sit right of the sidebar */
        .content-wrapper { margin-left: 240px; min-height: calc(100vh - 48px); background: var(--bs-body-bg, #fff); }
        /* bring content up so more fits without scrolling */
        .content { padding-top: 0.5rem; }

        /* Responsive adjustments */
        @media (max-width: 767.98px) {
            .main-sidebar { position: relative; width: 100%; height: auto; padding-top: 0; }
            .main-header.navbar { left: 0; }
            .content-wrapper { margin-left: 0; }
        }

        /* Hero styles (used by admin index) */
        .hero-section { text-align:center; padding:2rem 0; }
        .hero-tagline { font-size:2.5rem; font-weight:700; color:var(--rb-dark); margin-bottom:0.5rem }
        [data-bs-theme="dark"] .hero-tagline { color:#fff }
        .hero-description { color:var(--rb-gray); font-size:1.05rem; max-width:760px; margin:0.9rem auto; line-height:1.5 }

        /* Nav treeview (submenus) */
        .nav-treeview { display: none; padding-left: 1rem; }

        /* Bring component grid up slightly so more cards fit without scrolling */
        .component-grid { margin-top: 0.75rem; }        .nav-item.menu-open > .nav-treeview { display: block; }

        /* Small-box tweaks to match admin demo */
        .small-box { border-radius: .5rem; overflow: hidden; position: relative; display: block; }
        .small-box .inner { padding: 1rem; }
        .small-box .inner h3 { font-size: 1.55rem; font-weight: 700; margin: 0 0 .25rem; }
        .small-box .icon { position: absolute; top: 10px; right: 10px; font-size: 2.5rem; opacity: .25; }
        .small-box-footer { display:block; padding: .5rem 1rem; color: rgba(255,255,255,0.9); background: rgba(0,0,0,0.03); text-decoration:none; }


        /* Component cards (match frend look & feel) */
        .component-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
        .component-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; text-align: center; transition: border-color 0.2s, box-shadow 0.2s; }
        .component-card:hover { border-color: var(--rb-cyan); box-shadow: 0 4px 12px rgba(34, 167, 200, 0.15); }
        [data-bs-theme="dark"] .component-card { border-color: #334155; background: #1e293b; }
        [data-bs-theme="dark"] .component-card:hover { border-color: var(--rb-cyan); box-shadow: 0 4px 12px rgba(34, 167, 200, 0.25); }
        .component-card h6 { margin: 0.75rem 0 0.25rem; font-weight: 600; color: var(--rb-dark); }
        [data-bs-theme="dark"] .component-card h6 { color: #f1f5f9; }
        .component-card p { font-size: 0.85rem; color: var(--rb-gray); margin: 0; }
        .component-card .icon { font-size: 1.5rem; color: var(--rb-cyan); }
    </style>

    <g:layoutHead/>
</head>
<body class="hold-transition sidebar-mini layout-fixed layout-navbar-fixed">
<div class="wrapper">

    <!-- Navbar -->
    <nav class="main-header navbar navbar-expand navbar-white navbar-light">
        <!-- Right navbar links -->
        <ul class="navbar-nav ms-auto">
            <li class="nav-item dropdown">
                <a class="nav-link" data-bs-toggle="dropdown" href="#">
                    <i class="bi bi-circle-half"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="#" onclick="setTheme('light')"><i class="bi bi-sun me-2"></i>Light</a></li>
                    <li><a class="dropdown-item" href="#" onclick="setTheme('dark')"><i class="bi bi-moon me-2"></i>Dark</a></li>
                </ul>
            </li>
        </ul>
    </nav>

    <!-- Main Sidebar Container -->
    <aside class="main-sidebar sidebar-dark-primary elevation-4">
        <!-- Brand Logo -->
        <a href="/" class="brand-link">
            <!-- small FlowKraft mark -->
            <svg class="brand-image me-2" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z" fill="#22a7c8" />
            </svg>
            <span class="brand-text">FlowKraft Admin</span>
        </a>

        <!-- Sidebar Menu -->
        <nav class="mt-2">
                <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                    <li class="nav-item">
                        <a href="/" class="nav-link ${controllerName == 'index' || !controllerName ? 'active' : ''}">
                            <i class="bi bi-speedometer2 nav-icon"></i>
                            <p>Dashboard</p>
                        </a>
                    </li>
                            <li class="nav-item">
                        <a href="/documents" class="nav-link ${controllerName == 'documents' ? 'active' : ''}">
                            <i class="bi bi-file-earmark-text nav-icon"></i>
                            <p>Documents</p>
                        </a>
                    </li>
                    <li class="nav-header">Management</li>
                    <li class="nav-item">
                        <a href="/users" class="nav-link ${controllerName == 'users' ? 'active' : ''}">
                            <i class="bi bi-people nav-icon"></i>
                            <p>Users</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/roles" class="nav-link ${controllerName == 'roles' ? 'active' : ''}">
                            <i class="bi bi-shield-lock nav-icon"></i>
                            <p>Roles</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/workflows" class="nav-link ${controllerName == 'workflows' ? 'active' : ''}">
                            <i class="bi bi-diagram-3 nav-icon"></i>
                            <p>Workflows</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/exports" class="nav-link ${controllerName == 'exports' ? 'active' : ''}">
                            <i class="bi bi-cloud-arrow-up nav-icon"></i>
                            <p>Exports</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/dashboards" class="nav-link ${controllerName == 'dashboards' ? 'active' : ''}">
                            <i class="bi bi-bar-chart nav-icon"></i>
                            <p>Dashboards</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/auditLogs" class="nav-link ${controllerName == 'auditLogs' ? 'active' : ''}">
                            <i class="bi bi-journal-text nav-icon"></i>
                            <p>Audit Logs</p>
                        </a>
                    </li>
                </ul>
            </nav>
            <!-- /.sidebar-menu -->
        </div>
        <!-- /.sidebar -->
    </aside>

    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        <div class="content-header">
            <div class="container-fluid">
                <div class="row mb-2">
                    <div class="col-sm-6">
                        <h1 class="m-0">${pageTitle ?: ''}</h1>
                    </div> 
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="content">
            <div class="container-fluid">
                <g:layoutBody/>
            </div>
        </div>
    </div>
    <br/>
    <footer class="main-footer">
        <div class="float-end d-none d-sm-inline">
            <a href="https://www.reportburster.com" target="_blank" class="text-decoration-none text-muted">reportburster.com</a>&nbsp;&nbsp;&nbsp;
        </div>
        &nbsp;&nbsp;<strong>&copy; 2025 FlowKraft Systems</strong>
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

</body>
</html>