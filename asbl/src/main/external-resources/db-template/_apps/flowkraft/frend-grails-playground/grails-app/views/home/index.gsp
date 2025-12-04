<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>ReportBurster - Dashboards & Self Service Portals</title>
    <style>
        .hero-section {
            text-align: center;
            padding: 3rem 0;
        }
        .hero-tagline {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--rb-dark);
            margin-bottom: 0.5rem;
        }
        [data-bs-theme="dark"] .hero-tagline {
            color: #fff;
        }
        .hero-description {
            color: var(--rb-gray);
            font-size: 1.1rem;
            max-width: 700px;
            margin: 1.5rem auto;
        }
        .component-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .component-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .component-card:hover {
            border-color: var(--rb-cyan);
            box-shadow: 0 4px 12px rgba(34, 167, 200, 0.15);
        }
        [data-bs-theme="dark"] .component-card {
            border-color: #334155;
            background: #1e293b;
        }
        [data-bs-theme="dark"] .component-card:hover {
            border-color: var(--rb-cyan);
            box-shadow: 0 4px 12px rgba(34, 167, 200, 0.25);
        }
        .component-card h6 {
            margin: 0.75rem 0 0.25rem;
            font-weight: 600;
            color: var(--rb-dark);
        }
        [data-bs-theme="dark"] .component-card h6 {
            color: #f1f5f9;
        }
        .component-card p {
            font-size: 0.85rem;
            color: var(--rb-gray);
            margin: 0;
        }
        .component-card .icon {
            font-size: 1.5rem;
            color: var(--rb-cyan);
        }
    </style>
</head>
<body>
    <!-- Hero Section -->
    <div class="hero-section">
        <h1 class="hero-tagline">Dashboards. Self Service Portals.</h1>
        <br><br>
        <p class="hero-description">
            Bring your reports to the <strong>frontend</strong>: dashboards, portals, anywhere your users need them.
        </p>
    </div>
    
    <!-- Component Navigation -->
    <div class="container">
        <h5 class="text-center text-muted mb-3">Explore Components</h5>
        <div class="component-grid">
            <g:link controller="tabulator" class="component-card text-decoration-none">
                <i class="bi bi-table icon"></i>
                <h6>Tabulator</h6>
                <p>Interactive data tables</p>
            </g:link>
            <g:link controller="charts" class="component-card text-decoration-none">
                <i class="bi bi-bar-chart icon"></i>
                <h6>Charts</h6>
                <p>Data visualization</p>
            </g:link>
            <g:link uri="/pivottables" class="component-card text-decoration-none">
                <i class="bi bi-grid-3x3 icon"></i>
                <h6>Pivot Tables</h6>
                <p>Data analysis</p>
            </g:link>
            <g:link uri="/report-parameters" class="component-card text-decoration-none">
                <i class="bi bi-sliders icon"></i>
                <h6>Parameters</h6>
                <p>Report configuration</p>
            </g:link>
            <g:link controller="reports" class="component-card text-decoration-none">
                <i class="bi bi-file-earmark-text icon"></i>
                <h6>Reports</h6>
                <p>Full report examples</p>
            </g:link>
        </div>
    </div>
</body>
</html>
