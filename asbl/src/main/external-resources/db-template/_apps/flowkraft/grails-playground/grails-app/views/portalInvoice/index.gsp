<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="portal"/>
    <title>My Invoices - FlowKraft</title>
</head>
<body>

    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="fw-bold mb-1">My Invoices</h2>
                <p class="text-muted mb-0">View, pay, and download your invoices</p>
            </div>
        </div>

        <!-- Invoices Grid -->
        <div class="row g-4">
            <g:if test="${invoiceList}">
                <g:each in="${invoiceList}" var="invoice">
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div class="document-card-icon invoice">
                                        <i class="bi bi-file-text"></i>
                                    </div>
                                    <span class="badge ${invoice.statusBadgeClass}">${invoice.status.capitalize()}</span>
                                </div>
                                
                                <h5 class="card-title fw-bold">${invoice.invoiceNumber}</h5>
                                <p class="text-muted small mb-2">
                                    Due: <span class="${invoice.isOverdue() ? 'text-danger fw-medium' : ''}">
                                        <g:formatDate date="${invoice.dueDate}" format="MMM dd, yyyy"/>
                                    </span>
                                </p>
                                
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <span class="text-muted">Total</span>
                                    <span class="fs-4 fw-bold">${invoice.formatAmount(invoice.totalAmount)}</span>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <a href="${createLink(action: 'show', id: invoice.id)}" class="btn btn-outline-secondary btn-sm">
                                        <i class="bi bi-eye me-1"></i> View Details
                                    </a>
                                    <g:if test="${invoice.isPayable()}">
                                        <a href="${createLink(action: 'pay', id: invoice.id)}" class="btn btn-success btn-sm">
                                            <i class="bi bi-credit-card me-1"></i> Pay Now
                                        </a>
                                    </g:if>
                                    <g:elseif test="${invoice.status == 'paid'}">
                                        <button class="btn btn-outline-success btn-sm" disabled>
                                            <i class="bi bi-check-circle me-1"></i> Paid
                                        </button>
                                    </g:elseif>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent">
                                <small class="text-muted">
                                    <i class="bi bi-calendar me-1"></i>
                                    Issued: <g:formatDate date="${invoice.issueDate}" format="MMM dd, yyyy"/>
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
                            <h5>No Invoices Yet</h5>
                            <p class="text-muted mb-0">Your invoices will appear here once they are issued.</p>
                        </div>
                    </div>
                </div>
            </g:else>
        </div>
    </div>

</body>
</html>
