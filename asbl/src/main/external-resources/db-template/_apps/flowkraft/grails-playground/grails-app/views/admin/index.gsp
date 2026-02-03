<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Dashboard - Admin</title>
    <content tag="title">Dashboard</content>
</head>
<body>

    <div class="mb-4">
        <h1 id="admin-page-title" class="h4 fw-semibold text-dark">Dashboard</h1>
        <p class="text-muted small mb-0">Manage payslips and invoices</p>
    </div>

    <!-- Stats Cards - Simplified to match Next.js -->
    <div class="row g-3 mb-4" id="admin-stats-grid">
        <!-- Payslips -->
        <div class="col-sm-6 col-xl-3">
            <div class="card h-100" id="stat-card-payslips">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small text-uppercase fw-medium">Payslips</span>
                        <i class="bi bi-receipt text-muted"></i>
                    </div>
                    <div class="h3 fw-semibold mb-0" id="stat-value-payslips">${stats?.totalPayslips ?: 0}</div>
                </div>
            </div>
        </div>

        <!-- Invoices -->
        <div class="col-sm-6 col-xl-3">
            <div class="card h-100" id="stat-card-invoices">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small text-uppercase fw-medium">Invoices</span>
                        <i class="bi bi-file-text text-muted"></i>
                    </div>
                    <div class="h3 fw-semibold mb-0" id="stat-value-invoices">${stats?.totalInvoices ?: 0}</div>
                </div>
            </div>
        </div>

        <!-- Revenue -->
        <div class="col-sm-6 col-xl-3">
            <div class="card h-100" id="stat-card-revenue">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small text-uppercase fw-medium">Revenue</span>
                        <i class="bi bi-currency-dollar text-muted"></i>
                    </div>
                    <div class="h3 fw-semibold mb-0" id="stat-value-revenue">$${String.format('%,.0f', (stats?.totalRevenue ?: 0) as Double)}</div>
                </div>
            </div>
        </div>

        <!-- Pending -->
        <div class="col-sm-6 col-xl-3">
            <div class="card h-100" id="stat-card-pending">
                <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small text-uppercase fw-medium">Pending</span>
                        <i class="bi bi-clock text-muted"></i>
                    </div>
                    <div class="h3 fw-semibold mb-0" id="stat-value-pending">${(stats?.pendingInvoices ?: 0) + (stats?.draftPayslips ?: 0)}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions - Simplified to match Next.js -->
    <div class="row g-3" id="admin-quick-actions">
        <!-- Payslips Actions -->
        <div class="col-md-6">
            <div class="card" id="quick-actions-payslips">
                <div class="card-body p-3">
                    <h6 class="fw-medium text-dark mb-3">Payslips</h6>
                    <div class="d-flex gap-2">
                        <a href="${createLink(controller: 'payslip', action: 'index')}" 
                           class="btn btn-sm btn-dark" id="btn-view-payslips">
                            View All
                        </a>
                        <a href="${createLink(controller: 'payslip', action: 'create')}" 
                           class="btn btn-sm btn-outline-secondary" id="btn-new-payslip">
                            <i class="bi bi-plus"></i> New
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoices Actions -->
        <div class="col-md-6">
            <div class="card" id="quick-actions-invoices">
                <div class="card-body p-3">
                    <h6 class="fw-medium text-dark mb-3">Invoices</h6>
                    <div class="d-flex gap-2">
                        <a href="${createLink(controller: 'invoice', action: 'index')}" 
                           class="btn btn-sm btn-dark" id="btn-view-invoices">
                            View All
                        </a>
                        <a href="${createLink(controller: 'invoice', action: 'create')}" 
                           class="btn btn-sm btn-outline-secondary" id="btn-new-invoice">
                            <i class="bi bi-plus"></i> New
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
