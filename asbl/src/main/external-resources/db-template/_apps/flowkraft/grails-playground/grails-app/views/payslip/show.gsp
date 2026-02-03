<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Payslip ${payslip?.payslipNumber} - Admin</title>
    <content tag="title">Payslip Details</content>
</head>
<body>

    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item">
                <a href="${createLink(action: 'index')}">Payslips</a>
            </li>
            <li class="breadcrumb-item active">${payslip?.payslipNumber}</li>
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
            <!-- Payslip Details Card -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-receipt me-2 text-muted"></i>${payslip?.payslipNumber}
                    </h5>
                    <span class="badge ${payslip?.statusBadgeClass} fs-6">${payslip?.status?.capitalize()}</span>
                </div>
                <div class="card-body">
                    <!-- Employee Info -->
                    <h6 class="text-muted mb-3">Employee Information</h6>
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">Name</dt>
                                <dd class="col-sm-8">${payslip?.employeeName}</dd>
                                <dt class="col-sm-4 text-muted">Email</dt>
                                <dd class="col-sm-8">${payslip?.employeeEmail}</dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">ID</dt>
                                <dd class="col-sm-8">${payslip?.employeeId}</dd>
                                <dt class="col-sm-4 text-muted">Department</dt>
                                <dd class="col-sm-8">${payslip?.department ?: '-'}</dd>
                            </dl>
                        </div>
                    </div>

                    <hr/>

                    <!-- Pay Period -->
                    <h6 class="text-muted mb-3">Pay Period</h6>
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">Start</dt>
                                <dd class="col-sm-8"><g:formatDate date="${payslip?.payPeriodStart}" format="MMMM dd, yyyy"/></dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <dl class="row mb-0">
                                <dt class="col-sm-4 text-muted">End</dt>
                                <dd class="col-sm-8"><g:formatDate date="${payslip?.payPeriodEnd}" format="MMMM dd, yyyy"/></dd>
                            </dl>
                        </div>
                    </div>

                    <hr/>

                    <!-- Payment Details -->
                    <h6 class="text-muted mb-3">Payment Details</h6>
                    <div class="table-responsive">
                        <table class="table table-borderless">
                            <tbody>
                                <tr>
                                    <td class="text-muted">Gross Amount</td>
                                    <td class="text-end">${payslip?.formatAmount(payslip?.grossAmount)}</td>
                                </tr>
                                <tr>
                                    <td class="text-muted">Deductions</td>
                                    <td class="text-end text-danger">- ${payslip?.formatAmount(payslip?.deductions ?: 0)}</td>
                                </tr>
                                <tr class="border-top">
                                    <td class="fw-bold">Net Amount</td>
                                    <td class="text-end fw-bold fs-5 text-success">${payslip?.formatAmount(payslip?.netAmount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
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
                        <g:if test="${payslip?.status == 'draft'}">
                            <a href="${createLink(action: 'send', id: payslip?.id)}" class="btn btn-cyan">
                                <i class="bi bi-send me-2"></i>Send to Employee
                            </a>
                        </g:if>
                        <a href="${createLink(action: 'edit', id: payslip?.id)}" class="btn btn-outline-secondary">
                            <i class="bi bi-pencil me-2"></i>Edit Payslip
                        </a>
                        <a href="${createLink(action: 'download', id: payslip?.id)}" class="btn btn-outline-secondary">
                            <i class="bi bi-download me-2"></i>Download PDF
                        </a>
                        <hr/>
                        <button type="button" class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#deleteModal">
                            <i class="bi bi-trash me-2"></i>Delete Payslip
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
                        <dd class="col-6"><g:formatDate date="${payslip?.dateCreated}" format="MMM dd, yyyy HH:mm"/></dd>
                        <dt class="col-6 text-muted">Updated</dt>
                        <dd class="col-6"><g:formatDate date="${payslip?.lastUpdated}" format="MMM dd, yyyy HH:mm"/></dd>
                        <dt class="col-6 text-muted">Currency</dt>
                        <dd class="col-6">${payslip?.currency}</dd>
                    </dl>
                </div>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Delete Payslip</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete payslip <strong>${payslip?.payslipNumber}</strong>?</p>
                    <p class="text-muted mb-0">This action cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <g:form action="delete" id="${payslip?.id}" method="DELETE" style="display: inline;">
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
