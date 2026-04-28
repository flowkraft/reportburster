<%@ page import="flowkraft.frend.RbUtils" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Dashboards - DataPallas</title>
    <style>
        rb-chart { display: block; width: 100%; height: 100%; }
        rb-tabulator { display: block; width: 100%; }

        /* Dashboard selector */
        .dashboard-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .dashboard-selector {
            width: auto;
            min-width: 0;
        }

        /* KPI cards */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        @media (max-width: 991px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 575px) { .kpi-grid { grid-template-columns: 1fr; } }

        .kpi-card {
            border-radius: 8px;
            padding: 1.25rem;
            border: 1px solid #e5e7eb;
            border-left: 4px solid;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        [data-bs-theme="dark"] .kpi-card {
            border-color: #334155;
            background: #1e293b;
        }
        [data-bs-theme="dark"] .kpi-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .kpi-card .kpi-label {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 0.25rem;
        }
        [data-bs-theme="dark"] .kpi-card .kpi-label { color: #94a3b8; }

        .kpi-card .kpi-value {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .kpi-card .kpi-detail {
            font-size: 0.8rem;
            color: #6b7280;
        }
        [data-bs-theme="dark"] .kpi-card .kpi-detail { color: #94a3b8; }

        .kpi-up { color: #16a34a; }
        .kpi-down { color: #dc2626; }
        .kpi-warn { color: #d97706; }

        /* Dashboard panels */
        .dash-panel {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
        }
        [data-bs-theme="dark"] .dash-panel {
            border-color: #334155;
            background: #1e293b;
        }
        .dash-panel h6 {
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 1rem;
        }

        .chart-container { height: 280px; position: relative; overflow: hidden; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row mt-4">
            <div class="col-12">

                <!-- Toolbar: title + dashboard selector -->
                <div class="dashboard-toolbar">
                    <div>
                        <h4 class="mb-1">Dashboards</h4>
                        <p class="text-muted mb-0 small">Pre-built executive dashboards powered by <code>&lt;rb-chart&gt;</code> and <code>&lt;rb-tabulator&gt;</code> components.</p>
                    </div>
                    <select class="form-select dashboard-selector" id="dashboard-select">
                        <option value="cfo" selected>CFO Analytics Dashboard</option>
                    </select>
                </div>

                <!-- ════════════════════════════════════════════════════════ -->
                <!-- CFO Analytics Dashboard                                -->
                <!-- ════════════════════════════════════════════════════════ -->

                <!-- KPI Row 1 -->
                <div class="kpi-grid">
                    <div class="kpi-card" id="kpi-revenue" style="border-left-color: #16a34a;">
                        <div class="kpi-label">Total Revenue</div>
                        <div class="kpi-value">$847,320</div>
                        <div class="kpi-detail"><span class="kpi-up"><i class="bi bi-arrow-up"></i> 12.5%</span> vs last period</div>
                    </div>
                    <div class="kpi-card" id="kpi-profit" style="border-left-color: #2563eb;">
                        <div class="kpi-label">Gross Profit</div>
                        <div class="kpi-value">$292,180</div>
                        <div class="kpi-detail"><span style="color: #2563eb; font-weight: 600;">34.5%</span> profit margin</div>
                    </div>
                    <div class="kpi-card" id="kpi-orders" style="border-left-color: #7c3aed;">
                        <div class="kpi-label">Total Orders</div>
                        <div class="kpi-value">1,247</div>
                        <div class="kpi-detail"><span class="kpi-up"><i class="bi bi-arrow-up"></i> 8.3%</span> avg. $680/order</div>
                    </div>
                    <div class="kpi-card" id="kpi-ar" style="border-left-color: #dc2626;">
                        <div class="kpi-label">Outstanding AR</div>
                        <div class="kpi-value">$128,450</div>
                        <div class="kpi-detail"><span class="kpi-warn"><i class="bi bi-exclamation-triangle"></i> 23 invoices</span> overdue</div>
                    </div>
                </div>

                <!-- KPI Row 2 -->
                <div class="kpi-grid">
                    <div class="kpi-card" id="kpi-top-customer" style="border-left-color: #06b6d4;">
                        <div class="kpi-label">Top Customer</div>
                        <div class="kpi-value" style="font-size: 1.15rem;">Save-a-lot Markets</div>
                        <div class="kpi-detail"><strong>$89,340</strong> YTD revenue</div>
                    </div>
                    <div class="kpi-card" id="kpi-top-product" style="border-left-color: #f97316;">
                        <div class="kpi-label">Top Product</div>
                        <div class="kpi-value" style="font-size: 1.15rem;">C&ocirc;te de Blaye</div>
                        <div class="kpi-detail"><strong>89 units</strong> this period</div>
                    </div>
                    <div class="kpi-card" id="kpi-dso" style="border-left-color: #eab308;">
                        <div class="kpi-label">Days Sales Outstanding</div>
                        <div class="kpi-value">28</div>
                        <div class="kpi-detail"><span class="kpi-up"><i class="bi bi-arrow-down"></i> 3 days</span> vs target: 30</div>
                    </div>
                    <div class="kpi-card" id="kpi-top-region" style="border-left-color: #ec4899;">
                        <div class="kpi-label">Top Region</div>
                        <div class="kpi-value" style="font-size: 1.15rem;">Germany</div>
                        <div class="kpi-detail"><strong>$198,520</strong> (23.4% of total)</div>
                    </div>
                </div>

                <!-- Charts Row: Revenue Trend + Revenue by Category -->
                <div class="row">
                    <div class="col-lg-6">
                        <div class="dash-panel" id="panel-revenueTrend">
                            <h6><i class="bi bi-graph-up me-2 text-primary"></i>Revenue Trend</h6>
                            <div class="chart-container">
                                <rb-chart
                                    id="rb-revenueTrend"
                                    report-id="dashboard-cfo"
                                    component-id="revenueTrend"
                                    api-base-url="${RbUtils.apiBaseUrl}"
                                    api-key="${RbUtils.apiKey}"
                                ></rb-chart>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="dash-panel" id="panel-revenueByCategory">
                            <h6><i class="bi bi-pie-chart me-2" style="color: #7c3aed;"></i>Revenue by Category</h6>
                            <div class="chart-container">
                                <rb-chart
                                    id="rb-revenueByCategory"
                                    report-id="dashboard-cfo"
                                    component-id="revenueByCategory"
                                    api-base-url="${RbUtils.apiBaseUrl}"
                                    api-key="${RbUtils.apiKey}"
                                ></rb-chart>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Row: Customers Table + AR Aging + Country -->
                <div class="row">
                    <div class="col-lg-4">
                        <div class="dash-panel" id="panel-topCustomers">
                            <h6><i class="bi bi-people me-2" style="color: #06b6d4;"></i>Top 5 Customers</h6>
                            <rb-tabulator
                                id="rb-topCustomers"
                                report-id="dashboard-cfo"
                                component-id="topCustomers"
                                api-base-url="${RbUtils.apiBaseUrl}"
                                api-key="${RbUtils.apiKey}"
                            ></rb-tabulator>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="dash-panel" id="panel-arAging">
                            <h6><i class="bi bi-hourglass-split me-2" style="color: #eab308;"></i>Accounts Receivable Aging</h6>
                            <div class="chart-container">
                                <rb-chart
                                    id="rb-arAging"
                                    report-id="dashboard-cfo"
                                    component-id="arAging"
                                    api-base-url="${RbUtils.apiBaseUrl}"
                                    api-key="${RbUtils.apiKey}"
                                ></rb-chart>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="dash-panel" id="panel-revenueByCountry">
                            <h6><i class="bi bi-globe me-2" style="color: #ec4899;"></i>Revenue by Country</h6>
                            <div class="chart-container">
                                <rb-chart
                                    id="rb-revenueByCountry"
                                    report-id="dashboard-cfo"
                                    component-id="revenueByCountry"
                                    api-base-url="${RbUtils.apiBaseUrl}"
                                    api-key="${RbUtils.apiKey}"
                                ></rb-chart>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</body>
</html>
