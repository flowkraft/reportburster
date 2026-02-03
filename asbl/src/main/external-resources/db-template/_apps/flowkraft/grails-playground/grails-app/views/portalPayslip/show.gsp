<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="portal"/>
    <title>Payslip ${payslip?.payslipNumber} - FlowKraft</title>
</head>
<body>

    <div class="container">
        <!-- Breadcrumb -->
        <nav aria-label="breadcrumb" class="mb-4">
            <ol class="breadcrumb">
                <li class="breadcrumb-item">
                    <a href="${createLink(action: 'index')}">My Payslips</a>
                </li>
                <li class="breadcrumb-item active">${payslip?.payslipNumber}</li>
            </ol>
        </nav>

        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
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
                        <p class="mb-4">
                            <g:formatDate date="${payslip?.payPeriodStart}" format="MMMM dd, yyyy"/>
                            <span class="mx-2">—</span>
                            <g:formatDate date="${payslip?.payPeriodEnd}" format="MMMM dd, yyyy"/>
                        </p>

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
                                        <td class="fw-bold fs-5">Net Amount</td>
                                        <td class="text-end fw-bold fs-4 text-success">${payslip?.formatAmount(payslip?.netAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-download me-2 text-muted"></i>Download
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted mb-3">Download your payslip as a PDF document for your records.</p>
                        <a href="${createLink(action: 'download', id: payslip?.id)}" class="btn btn-cyan w-100">
                            <i class="bi bi-file-pdf me-2"></i> Download PDF
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
