<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="portal"/>
    <title>Invoice ${invoice?.invoiceNumber} - FlowKraft</title>
</head>
<body>

    <div class="container">
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <a href="${createLink(action: 'index')}">My Invoices</a>
                </li>
                <li class="breadcrumb-item active">${invoice?.invoiceNumber}</li>
            </ol>
        </nav>

        <!-- Flash Messages -->
        <g:if test="${flash.message}">
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="bi bi-check-circle me-2"></i>${flash.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        </g:if>
        <g:if test="${flash.error}">
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-circle me-2"></i>${flash.error}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        </g:if>

        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-file-text me-2 text-muted"></i>${invoice?.invoiceNumber}
                        </h5>
                        <span class="badge ${invoice?.statusBadgeClass} fs-6">${invoice?.status?.capitalize()}</span>
                    </div>
                    <div class="card-body">
                        <!-- Dates -->
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <dl class="row mb-0">
                                    <dt class="col-sm-5 text-muted">Issue Date</dt>
                                    <dd class="col-sm-7"><g:formatDate date="${invoice?.issueDate}" format="MMMM dd, yyyy"/></dd>
                                </dl>
                            </div>
                            <div class="col-md-6">
                                <dl class="row mb-0">
                                    <dt class="col-sm-5 text-muted">Due Date</dt>
                                    <dd class="col-sm-7 ${invoice?.isOverdue() ? 'text-danger fw-bold' : ''}">
                                        <g:formatDate date="${invoice?.dueDate}" format="MMMM dd, yyyy"/>
                                        <g:if test="${invoice?.isOverdue()}">
                                            <span class="badge bg-danger ms-2">Overdue</span>
                                        </g:if>
                                    </dd>
                                </dl>
                            </div>
                        </div>

                        <hr/>

                        <!-- Amount Details -->
                        <h6 class="text-muted mb-3">Amount Details</h6>
                        <div class="table-responsive">
                            <table class="table table-borderless">
                                <tbody>
                                    <tr>
                                        <td class="text-muted">Subtotal</td>
                                        <td class="text-end">${invoice?.formatAmount(invoice?.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td class="text-muted">Tax (${invoice?.taxRate ?: 0}%)</td>
                                        <td class="text-end">${invoice?.formatAmount(invoice?.taxAmount ?: 0)}</td>
                                    </tr>
                                    <g:if test="${invoice?.discount > 0}">
                                        <tr>
                                            <td class="text-muted">Discount</td>
                                            <td class="text-end text-danger">- ${invoice?.formatAmount(invoice?.discount)}</td>
                                        </tr>
                                    </g:if>
                                    <tr class="border-top">
                                        <td class="fw-bold fs-5">Total Amount</td>
                                        <td class="text-end fw-bold fs-4">${invoice?.formatAmount(invoice?.totalAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Notes -->
                        <g:if test="${invoice?.notes}">
                            <hr/>
                            <h6 class="text-muted mb-3">Notes</h6>
                            <p class="text-muted">${invoice?.notes}</p>
                        </g:if>

                        <!-- Payment Info (if paid) -->
                        <g:if test="${invoice?.status == 'paid'}">
                            <hr/>
                            <div class="alert alert-success mb-0">
                                <h6 class="alert-heading">
                                    <i class="bi bi-check-circle me-2"></i>Payment Received
                                </h6>
                                <p class="mb-1">
                                    <strong>Method:</strong> ${invoice?.paymentMethodDisplay}
                                </p>
                                <p class="mb-0">
                                    <strong>Date:</strong> <g:formatDate date="${invoice?.paidAt}" format="MMMM dd, yyyy 'at' HH:mm"/>
                                </p>
                            </div>
                        </g:if>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <!-- Payment Card -->
                <g:if test="${invoice?.isPayable()}">
                    <div class="card mb-4">
                        <div class="card-header bg-success text-white">
                            <h5 class="mb-0">
                                <i class="bi bi-credit-card me-2"></i>Pay Invoice
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="text-center mb-3">
                                <span class="fs-3 fw-bold">${invoice?.formatAmount(invoice?.totalAmount)}</span>
                                <p class="text-muted mb-0">Amount Due</p>
                            </div>
                            <a href="${createLink(action: 'pay', id: invoice?.id)}" class="btn btn-success w-100 btn-lg">
                                <i class="bi bi-lock me-2"></i> Pay Now
                            </a>
                            <p class="text-muted small text-center mt-3 mb-0">
                                <i class="bi bi-shield-check me-1"></i>
                                Secure payment via Stripe or PayPal
                            </p>
                        </div>
                    </div>
                </g:if>

                <!-- Download Card -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-download me-2 text-muted"></i>Download
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-3">Download your invoice as a PDF document.</p>
                        <a href="${createLink(action: 'download', id: invoice?.id)}" class="btn btn-outline-secondary w-100">
                            <i class="bi bi-file-pdf me-2"></i> Download PDF
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
