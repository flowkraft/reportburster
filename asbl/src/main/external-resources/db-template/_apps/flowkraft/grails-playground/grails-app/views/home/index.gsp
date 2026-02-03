<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>ReportBurster - Dashboards & Self Service Portals</title>
    <style>
        /* Hero section - matches Next.js */
        .hero-section {
            text-align: center;
            padding: 3rem 0;
            max-width: 1100px;
            margin: 0 auto;
        }
        
        .hero-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--rb-dark);
            margin-bottom: 1rem;
        }
        
        [data-bs-theme="dark"] .hero-title {
            color: #f1f5f9;
        }
        
        .hero-description {
            color: var(--rb-gray);
            font-size: 1.125rem;
            max-width: 800px;
            margin: 0 auto 2rem;
            line-height: 1.7;
        }
        
        [data-bs-theme="dark"] .hero-description {
            color: #94a3b8;
        }
        
        .hero-description strong {
            color: var(--rb-dark);
        }
        
        [data-bs-theme="dark"] .hero-description strong {
            color: #f1f5f9;
        }
        
        /* Component grid - matches Next.js exactly */
        .component-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .component-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 1.5rem;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            text-decoration: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .component-card:hover {
            border-color: var(--rb-cyan);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        [data-bs-theme="dark"] .component-card {
            background: #1e293b;
            border-color: #334155;
        }
        
        [data-bs-theme="dark"] .component-card:hover {
            border-color: var(--rb-cyan);
            box-shadow: 0 4px 12px rgba(34, 167, 200, 0.2);
        }
        
        .component-card .icon {
            font-size: 2rem;
            color: var(--rb-cyan);
            margin-bottom: 0.75rem;
        }
        
        .component-card h6 {
            font-weight: 600;
            color: var(--rb-dark);
            margin-bottom: 0.25rem;
        }
        
        [data-bs-theme="dark"] .component-card h6 {
            color: #f1f5f9;
        }
        
        .component-card p {
            font-size: 0.875rem;
            color: var(--rb-gray);
            margin: 0;
        }
        
        .section-title {
            text-align: center;
            color: var(--rb-gray);
            font-size: 0.875rem;
            font-weight: 500;
            margin-bottom: 1.5rem;
        }
    </style>
</head>
<body>

    <!-- Hero Section - matches Next.js page.tsx exactly -->
    <section class="hero-section">
        <h1 class="hero-title">Dashboards. Self Service Portals.</h1>
        <p class="hero-description">
            Bring your reports to the <strong>frontend</strong>: dashboards, portals, anywhere your users need them.
            Use our 'quick to get things done' (highly capable and fully customizable) portal, or
            <strong>embed ReportBurster reports</strong> directly into your existing web applications and portals —
            responsive, secure, and themeable to match your look and feel.
        </p>
    </section>
    
    <!-- Component Grid - matches Next.js component array exactly -->
    <section class="container">
        <h5 class="section-title">Explore Components</h5>
        <div class="component-grid">
            
            <!-- Tabulator - matches Next.js { href: "/tabulator", icon: Table, title: "Tabulator", description: "Interactive data tables" } -->
            <a href="${createLink(uri: '/tabulator')}" class="component-card">
                <i class="bi bi-table icon"></i>
                <h6>Tabulator</h6>
                <p>Interactive data tables</p>
            </a>
            
            <!-- Charts - matches Next.js { href: "/charts", icon: BarChart3, title: "Charts", description: "Data visualization" } -->
            <a href="${createLink(uri: '/charts')}" class="component-card">
                <i class="bi bi-bar-chart icon"></i>
                <h6>Charts</h6>
                <p>Data visualization</p>
            </a>
            
            <!-- Pivot Tables - matches Next.js { href: "/pivot-tables", icon: Grid3x3, title: "Pivot Tables", description: "Data analysis" } -->
            <a href="${createLink(uri: '/pivot-tables')}" class="component-card">
                <i class="bi bi-grid-3x3 icon"></i>
                <h6>Pivot Tables</h6>
                <p>Data analysis</p>
            </a>
            
            <!-- Parameters - matches Next.js { href: "/report-parameters", icon: Sliders, title: "Parameters", description: "Report configuration" } -->
            <a href="${createLink(uri: '/report-parameters')}" class="component-card">
                <i class="bi bi-sliders icon"></i>
                <h6>Parameters</h6>
                <p>Report configuration</p>
            </a>
            
            <!-- Reports - matches Next.js { href: "/reports", icon: FileText, title: "Reports", description: "Full report examples" } -->
            <a href="${createLink(uri: '/reports')}" class="component-card">
                <i class="bi bi-file-earmark-text icon"></i>
                <h6>Reports</h6>
                <p>Full report examples</p>
            </a>
            
            <!-- Your Canvas - matches Next.js { href: "/your-canvas", icon: Layout, title: "Your Canvas", description: "Build your own" } -->
            <a href="${createLink(uri: '/your-canvas')}" class="component-card">
                <i class="bi bi-easel icon"></i>
                <h6>Your Canvas</h6>
                <p>Build your own</p>
            </a>
            
        </div>
    </section>

</body>
</html>
