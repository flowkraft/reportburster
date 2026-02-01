<%@ page import="flowkraft.frend.RbUtils" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Your Canvas - ReportBurster</title>
    <style>
        .canvas-hero {
            text-align: center;
            padding: 3rem 2rem;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            margin-bottom: 2rem;
        }
        [data-bs-theme="dark"] .canvas-hero {
            background: linear-gradient(135deg, #0c4a6e 0%, #164e63 100%);
        }
        .canvas-hero h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #0369a1;
            margin-bottom: 1rem;
        }
        [data-bs-theme="dark"] .canvas-hero h1 {
            color: #7dd3fc;
        }
        .canvas-hero .lead {
            font-size: 1.25rem;
            color: #475569;
            max-width: 700px;
            margin: 0 auto 1.5rem;
        }
        [data-bs-theme="dark"] .canvas-hero .lead {
            color: #cbd5e1;
        }
        
        .canvas-section {
            margin-bottom: 3rem;
        }
        .canvas-section h4 {
            color: #1e40af;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        [data-bs-theme="dark"] .canvas-section h4 {
            color: #93c5fd;
        }
        
        .component-showcase {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }
        
        .showcase-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .showcase-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }
        [data-bs-theme="dark"] .showcase-card {
            background: #1e293b;
            border-color: #334155;
        }
        
        .showcase-card .icon {
            font-size: 2.5rem;
            color: var(--rb-cyan);
            margin-bottom: 1rem;
        }
        .showcase-card h5 {
            color: #1e293b;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        [data-bs-theme="dark"] .showcase-card h5 {
            color: #f1f5f9;
        }
        .showcase-card p {
            color: #64748b;
            font-size: 0.95rem;
            margin-bottom: 0;
        }
        [data-bs-theme="dark"] .showcase-card p {
            color: #94a3b8;
        }
        
        .code-snippet {
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 8px;
            padding: 1rem;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.85rem;
            overflow-x: auto;
            margin: 1rem 0;
        }
        .code-snippet .tag {
            color: #569cd6;
        }
        .code-snippet .attr {
            color: #9cdcfe;
        }
        .code-snippet .value {
            color: #ce9178;
        }
        
        .cta-section {
            background: linear-gradient(135deg, #22a7c8 0%, #1d4ed8 100%);
            color: white;
            padding: 2.5rem;
            border-radius: 12px;
            text-align: center;
        }
        .cta-section h3 {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        .cta-section p {
            font-size: 1.1rem;
            opacity: 0.95;
            max-width: 600px;
            margin: 0 auto 1.5rem;
        }
        .cta-section .btn {
            background: white;
            color: #1e40af;
            font-weight: 600;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        .cta-section .btn:hover {
            transform: scale(1.05);
        }
        
        .step-list {
            counter-reset: step-counter;
            list-style: none;
            padding: 0;
        }
        .step-list li {
            counter-increment: step-counter;
            position: relative;
            padding-left: 3rem;
            margin-bottom: 1.25rem;
        }
        .step-list li::before {
            content: counter(step-counter);
            position: absolute;
            left: 0;
            top: 0;
            width: 2rem;
            height: 2rem;
            background: var(--rb-cyan);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 0.9rem;
        }
        .step-list li strong {
            color: #1e293b;
        }
        [data-bs-theme="dark"] .step-list li strong {
            color: #f1f5f9;
        }
    </style>
</head>
<body>
    <div class="container py-4">
        
        <!-- Hero Section -->
        <div class="canvas-hero">
            <h1><i class="bi bi-palette"></i> Your Canvas Awaits</h1>
            <p class="lead">
                You have the data. You have the components. Now build something that matters to your users.
            </p>
        </div>
        
        <!-- What You Can Build -->
        <div class="canvas-section">
            <h4><i class="bi bi-stars me-2"></i>What You Can Build</h4>
            <p>Combine these components to create dashboards, self-service portals, and interactive reports:</p>
            
            <div class="component-showcase">
                <div class="showcase-card">
                    <i class="bi bi-table icon"></i>
                    <h5>Data Tables</h5>
                    <p>Sortable, filterable, paginated tables. Let users explore data their way.</p>
                </div>
                <div class="showcase-card">
                    <i class="bi bi-bar-chart icon"></i>
                    <h5>Charts</h5>
                    <p>Bar, line, pie, area charts. Turn numbers into stories.</p>
                </div>
                <div class="showcase-card">
                    <i class="bi bi-grid-3x3 icon"></i>
                    <h5>Pivot Tables</h5>
                    <p>Drag-and-drop analysis. Users answer their own questions.</p>
                </div>
                <div class="showcase-card">
                    <i class="bi bi-sliders icon"></i>
                    <h5>Parameters</h5>
                    <p>Date pickers, dropdowns, filters. Dynamic reports that respond to user input.</p>
                </div>
                <div class="showcase-card">
                    <i class="bi bi-file-earmark-text icon"></i>
                    <h5>Rendered Reports</h5>
                    <p>Invoices, payslips, statements. Pixel-perfect documents from templates.</p>
                </div>
                <div class="showcase-card">
                    <i class="bi bi-columns-gap icon"></i>
                    <h5>Dashboards</h5>
                    <p>Combine all of the above. One page, complete insight.</p>
                </div>
            </div>
        </div>
        
        <!-- How It Works -->
        <div class="canvas-section">
            <h4><i class="bi bi-gear me-2"></i>How It Works</h4>
            
            <div class="row">
                <div class="col-lg-6">
                    <ol class="step-list">
                        <li><strong>Define your reports in ReportBurster</strong> — Connect to any datasource that returns rows</li>
                        <li><strong>Add the component to your dashboard</strong> — One HTML tag per visualization</li>
                        <li><strong>Deploy</strong> — Users access it through any web page</li>
                    </ol>
                </div>
                <div class="col-lg-6">
                    <p><strong>Example: Add a chart to any page</strong></p>
                    <div class="code-snippet">
<span class="tag">&lt;rb-chart</span>
    <span class="attr">report-code</span>=<span class="value">"sales-by-region"</span>
    <span class="attr">api-base-url</span>=<span class="value">"${RbUtils.apiBaseUrl}"</span>
    <span class="attr">api-key</span>=<span class="value">"${RbUtils.apiKey}"</span>
<span class="tag">&gt;&lt;/rb-chart&gt;</span>
                    </div>
                    <p class="text-muted small">That's it. The component fetches data, reads your chart config, and renders.</p>
                </div>
            </div>
        </div>
        
        <!-- Ideas & Inspiration -->
        <div class="canvas-section">
            <h4><i class="bi bi-lightbulb me-2"></i>Ideas to Get You Started</h4>
            
            <div class="row g-4">
                
                <div class="col-md-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title"><i class="bi bi-people text-primary me-2"></i>HR Portal</h6>
                            <br/>
                            <p class="card-text small text-muted">
                                Employee payslips, leave balances, org charts. Each employee sees only their own data.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title"><i class="bi bi-graph-up text-success me-2"></i>Sales Dashboard</h6>
                            <br/>
                            <p class="card-text small text-muted">
                                Revenue by region, top products, quarterly trends. Pivot table for ad-hoc analysis.
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title"><i class="bi bi-receipt text-warning me-2"></i>Customer Portal</h6>
                            <br/>
                            <p class="card-text small text-muted">
                                Invoices, statements, order history. Customers self-serve instead of calling support.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title"><i class="bi bi-book text-info me-2"></i>Student Portal</h6>
                            <br/>
                            <p class="card-text small text-muted">
                                Grades, class schedules, assignments, tuition payments. Students and parents access everything in one place.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        
        <!-- Call to Action -->
        <div class="cta-section">
            <h3>Start Building</h3>
            <p>
                Pick a component. Connect your data. Ship something users will love.
            </p>
            <a href="${createLink(controller: 'tabulator')}" class="btn">
                <i class="bi bi-play-fill me-2"></i>Explore Components
            </a>
        </div>
        
    </div>
</body>
</html>
