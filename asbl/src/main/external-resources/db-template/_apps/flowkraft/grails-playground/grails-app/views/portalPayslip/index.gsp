<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="portal"/>
    <title>My Payslips - FlowKraft</title>
</head>
<body>

    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="fw-bold mb-1">My Payslips</h2>
                <p class="text-muted mb-0">View and download your salary statements</p>
            </div>
        </div>

        <!-- Payslips Grid -->
        <div class="row g-4">
            <g:if test="${payslipList}">
                <g:each in="${payslipList}" var="payslip">
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div class="document-card-icon payslip">
                                        <i class="bi bi-receipt"></i>
                                    </div>
                                    <span class="badge ${payslip.statusBadgeClass}">${payslip.status.capitalize()}</span>
                                </div>
                                
                                <h5 class="card-title fw-bold">${payslip.payslipNumber}</h5>
                                <p class="text-muted small mb-2">${payslip.payPeriodFormatted}</p>
                                
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <span class="text-muted">Net Amount</span>
                                    <span class="fs-4 fw-bold text-success">${payslip.formatAmount(payslip.netAmount)}</span>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <a href="${createLink(action: 'show', id: payslip.id)}" class="btn btn-outline-secondary btn-sm">
                                        <i class="bi bi-eye me-1"></i> View Details
                                    </a>
                                    <a href="${createLink(action: 'download', id: payslip.id)}" class="btn btn-cyan btn-sm">
                                        <i class="bi bi-download me-1"></i> Download PDF
                                    </a>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent">
                                <small class="text-muted">
                                    <i class="bi bi-calendar me-1"></i>
                                    <g:formatDate date="${payslip.dateCreated}" format="MMM dd, yyyy"/>
                                </small>
                            </div>
                        </div>
                    </div>
                </g:each>
            </g:if>
            <g:else>
                <div class="col-12">
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="bi bi-inbox fs-1 text-muted d-block mb-3"></i>
                            <h5>No Payslips Yet</h5>
                            <p class="text-muted mb-0">Your payslips will appear here once they are issued.</p>
                        </div>
                    </div>
                </div>
            </g:else>
        </div>
    </div>

</body>
</html>
