<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Invoice ${invoice?.invoiceNumber} - Admin</title>
    <content tag="title">Invoice Details</content>
</head>
<body>

    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item">
                <a href="${createLink(action: 'index')}">Invoices</a>
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
            <!-- Invoice Details Card -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-file-text me-2 text-muted"></i>${invoice?.invoiceNumber}
                    </h5>
                    <span class="badge ${invoice?.statusBadgeClass} fs-6">${invoice?.status?.capitalize()}</span>
                </div>
                <div class="card-body">
                    <!-- Customer Info -->
                    <h6 class="text-muted mb-3">Customer Information</h6>
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">Name</dt>
                                <dd class="col-sm-8">${invoice?.customerName}</dd>
                                <dt class="col-sm-4 text-muted">Email</dt>
                                <dd class="col-sm-8">${invoice?.customerEmail}</dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">ID</dt>
                                <dd class="col-sm-8">${invoice?.customerId}</dd>
                                <dt class="col-sm-4 text-muted">Address</dt>
                                <dd class="col-sm-8">${invoice?.customerAddress ?: '-'}</dd>
                            </dl>
                        </div>
                    </div>

                    <hr/>

                    <!-- Dates -->
                    <h6 class="text-muted mb-3">Invoice Dates</h6>
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">Issue Date</dt>
                                <dd class="col-sm-8"><g:formatDate date="${invoice?.issueDate}" format="MMMM dd, yyyy"/></dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">Due Date</dt>
                                <dd class="col-sm-8 ${invoice?.isOverdue() ? 'text-danger fw-bold' : ''}">
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
                                    <td class="fw-bold">Total Amount</td>
                                    <td class="text-end fw-bold fs-4 text-success">${invoice?.formatAmount(invoice?.totalAmount)}</td>
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
                        <h6 class="text-muted mb-3">Payment Information</h6>
                        <div class="alert alert-success mb-0">
                            <div class="row">
                                <div class="col-md-6">
                                    <dl class="row mb-0">
                                        <dt class="col-sm-4">Method</dt>
                                        <dd class="col-sm-8">
                                            <i class="bi bi-${invoice?.paymentMethod == 'stripe' ? 'stripe' : invoice?.paymentMethod == 'paypal' ? 'paypal' : 'bank'} me-1"></i>
                                            ${invoice?.paymentMethodDisplay}
                                        </dd>
                                    </dl>
                                </div>
                                <div class="col-md-6">
                                    <dl class="row mb-0">
                                        <dt class="col-sm-4">Paid At</dt>
                                        <dd class="col-sm-8"><g:formatDate date="${invoice?.paidAt}" format="MMM dd, yyyy HH:mm"/></dd>
                                    </dl>
                                </div>
                            </div>
                            <g:if test="${invoice?.paymentReference}">
                                <hr class="my-2"/>
                                <small class="text-muted">Reference: ${invoice?.paymentReference}</small>
                            </g:if>
                        </div>
                    </g:if>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <!-- Actions Card -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-lightning me-2 text-muted"></i>Actions
                    </h5>
                </div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        <g:if test="${invoice?.status == 'draft'}">
                            <a href="${createLink(action: 'send', id: invoice?.id)}" class="btn btn-violet">
                                <i class="bi bi-send me-2"></i>Send to Customer
                            </a>
                        </g:if>
                        <g:if test="${invoice?.isPayable()}">
                            <button type="button" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#markPaidModal">
                                <i class="bi bi-check-circle me-2"></i>Mark as Paid
                            </button>
                        </g:if>
                        <a href="${createLink(action: 'edit', id: invoice?.id)}" class="btn btn-outline-secondary">
                            <i class="bi bi-pencil me-2"></i>Edit Invoice
                        </a>
                        <a href="${createLink(action: 'download', id: invoice?.id)}" class="btn btn-outline-secondary">
                            <i class="bi bi-download me-2"></i>Download PDF
                        </a>
                        <g:if test="${invoice?.status != 'cancelled' && invoice?.status != 'paid'}">
                            <a href="${createLink(action: 'cancel', id: invoice?.id)}" class="btn btn-outline-warning"
                               onclick="return confirm('Are you sure you want to cancel this invoice?')">
                                <i class="bi bi-x-circle me-2"></i>Cancel Invoice
                            </a>
                        </g:if>
                        <hr/>
                        <button type="button" class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteModal">
                            <i class="bi bi-trash me-2"></i>Delete Invoice
                        </button>
                    </div>
                </div>
            </div>

            <!-- Metadata Card -->
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-info-circle me-2 text-muted"></i>Details
                    </h5>
                </div>
                <div class="card-body">
                    <dl class="row mb-0">
                        <dt class="col-6 text-muted">Created</dt>
                        <dd class="col-6"><g:formatDate date="${invoice?.dateCreated}" format="MMM dd, yyyy HH:mm"/></dd>
                        <dt class="col-6 text-muted">Updated</dt>
                        <dd class="col-6"><g:formatDate date="${invoice?.lastUpdated}" format="MMM dd, yyyy HH:mm"/></dd>
                        <dt class="col-6 text-muted">Currency</dt>
                        <dd class="col-6">${invoice?.currency}</dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>

    <!-- Mark as Paid Modal -->
    <div class="modal fade" id="markPaidModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <g:form action="markPaid" id="${invoice?.id}" method="POST">
                    <div class="modal-header">
                        <h5 class="modal-title">Mark Invoice as Paid</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Payment Method</label>
                            <select class="form-select" name="paymentMethod" required>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash</option>
                                <option value="stripe">Stripe</option>
                                <option value="paypal">PayPal</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Payment Reference (Optional)</label>
                            <input type="text" class="form-control" name="paymentReference" placeholder="e.g., Bank transfer reference"/>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-success">
                            <i class="bi bi-check-lg me-1"></i> Mark as Paid
                        </button>
                    </div>
                </g:form>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Delete Invoice</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete invoice <strong>${invoice?.invoiceNumber}</strong>?</p>
                    <p class="text-muted mb-0">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <g:form action="delete" id="${invoice?.id}" method="DELETE" style="display: inline;">
                        <button type="submit" class="btn btn-danger">
                            <i class="bi bi-trash me-1"></i> Delete
                        </button>
                    </g:form>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
