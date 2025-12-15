<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title><g:layoutTitle default="FlowKraft Admin Panel"/></title>

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="${assetPath(src: 'favicon.svg')}"/>

    <!-- Google Fonts - Inter -->
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
        }
        [data-bs-theme="dark"] {
            --bs-body-bg: #0f172a;
            --bs-body-color: #e2e8f0;
            --bs-tertiary-bg: #1e293b;
            --bs-border-color: #334155;
        }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        /* Header brand */
        .brand-text { font-weight:700; font-size:1.05rem; }

        /* Sidebar tweaks */
        .main-sidebar { background: linear-gradient(180deg,#0b1220,#0f172a); }
        .nav-sidebar .nav-link.active { color: var(--rb-cyan); }

        /* Hero styles (used by admin index) */
        .hero-section { text-align:center; padding:3rem 0; }
        .hero-tagline { font-size:2.5rem; font-weight:700; color:var(--rb-dark); margin-bottom:0.5rem }
        [data-bs-theme="dark"] .hero-tagline { color:#fff }
        .hero-description { color:var(--rb-gray); font-size:1.05rem; max-width:760px; margin:1.25rem auto; line-height:1.5 }

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
<body class="hold-transition sidebar-mini layout-fixed">
<div class="wrapper">

    <!-- Navbar -->
    <nav class="main-header navbar navbar-expand navbar-white navbar-light">
        <!-- Left navbar links -->
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" data-widget="pushmenu" href="#" role="button"><i class="bi bi-list"></i></a>
            </li>
            <li class="nav-item d-none d-sm-inline-block">
                <a href="/" class="nav-link">Home</a>
            </li>
        </ul>

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
            <svg class="brand-icon me-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            <span class="brand-text">FlowKraft</span>
        </a>

        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Sidebar user panel (optional) -->
            <div class="user-panel mt-3 pb-3 mb-3 d-flex">
                <div class="image">
                    <img src="${assetPath(src:'avatar.png')}" class="img-circle elevation-2" alt="User Image">
                </div>
                <div class="info">
                    <a href="#" class="d-block">Administrator</a>
                </div>
            </div>

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
                        <a href="/controllers" class="nav-link">
                            <i class="bi bi-list nav-icon"></i>
                            <p>Controllers</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/domains" class="nav-link">
                            <i class="bi bi-diagram-3 nav-icon"></i>
                            <p>Domains</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="/reports" class="nav-link">
                            <i class="bi bi-file-earmark-text nav-icon"></i>
                            <p>Reports</p>
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
                        <h1 class="m-0">&nbsp;</h1>
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

    <footer class="main-footer">
        <div class="float-end d-none d-sm-inline">
            <a href="https://www.flowkraft.com" target="_blank" class="text-decoration-none text-muted">flowkraft.com</a>
        </div>
        <strong>&copy; 2025 FlowKraft Systems</strong>
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