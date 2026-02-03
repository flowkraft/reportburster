<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Create Payslip - Admin</title>
    <content tag="title">Create Payslip</content>
</head>
<body>

    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item">
                <a href="${createLink(action: 'index')}">Payslips</a>
            </li>
            <li class="breadcrumb-item active">Create New</li>
        </ol>
    </nav>

    <div class="row">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-plus-circle me-2 text-muted"></i>New Payslip
                    </h5>
                </div>
                <div class="card-body">
                    <g:form action="save" method="POST">
                        <!-- Employee Information -->
                        <h6 class="text-muted mb-3">Employee Information</h6>
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Employee ID <span class="text-danger">*</span></label>
                                <input type="text" class="form-control ${hasErrors(bean: payslip, field: 'employeeId', 'is-invalid')}" 
                                       name="employeeId" value="${payslip?.employeeId}"/>
                                <g:renderErrors bean="${payslip}" field="employeeId"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Employee Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control ${hasErrors(bean: payslip, field: 'employeeName', 'is-invalid')}" 
                                       name="employeeName" value="${payslip?.employeeName}"/>
                                <g:renderErrors bean="${payslip}" field="employeeName"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Employee Email <span class="text-danger">*</span></label>
                                <input type="email" class="form-control ${hasErrors(bean: payslip, field: 'employeeEmail', 'is-invalid')}" 
                                       name="employeeEmail" value="${payslip?.employeeEmail}"/>
                                <g:renderErrors bean="${payslip}" field="employeeEmail"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Department</label>
                                <input type="text" class="form-control" name="department" value="${payslip?.department}"/>
                            </div>
                        </div>

                        <hr class="my-4"/>

                        <!-- Pay Period -->
                        <h6 class="text-muted mb-3">Pay Period</h6>
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Period Start <span class="text-danger">*</span></label>
                                <input type="date" class="form-control ${hasErrors(bean: payslip, field: 'payPeriodStart', 'is-invalid')}" 
                                       name="payPeriodStart" value="${payslip?.payPeriodStart ? new java.text.SimpleDateFormat('yyyy-MM-dd').format(payslip.payPeriodStart) : ''}"/>
                                <g:renderErrors bean="${payslip}" field="payPeriodStart"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Period End <span class="text-danger">*</span></label>
                                <input type="date" class="form-control ${hasErrors(bean: payslip, field: 'payPeriodEnd', 'is-invalid')}" 
                                       name="payPeriodEnd" value="${payslip?.payPeriodEnd ? new java.text.SimpleDateFormat('yyyy-MM-dd').format(payslip.payPeriodEnd) : ''}"/>
                                <g:renderErrors bean="${payslip}" field="payPeriodEnd"/>
                            </div>
                        </div>

                        <hr class="my-4"/>

                        <!-- Payment Details -->
                        <h6 class="text-muted mb-3">Payment Details</h6>
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <label class="form-label">Gross Amount <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" class="form-control ${hasErrors(bean: payslip, field: 'grossAmount', 'is-invalid')}" 
                                           name="grossAmount" value="${payslip?.grossAmount}" onchange="calculateNet()"/>
                                </div>
                                <g:renderErrors bean="${payslip}" field="grossAmount"/>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Deductions</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" class="form-control" id="deductions"
                                           name="deductions" value="${payslip?.deductions ?: 0}" onchange="calculateNet()"/>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Net Amount</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" class="form-control" id="netAmount"
                                           name="netAmount" value="${payslip?.netAmount}" readonly/>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Currency</label>
                                <select class="form-select" name="currency">
                                    <option value="USD" ${payslip?.currency == 'USD' ? 'selected' : ''}>USD</option>
                                    <option value="EUR" ${payslip?.currency == 'EUR' ? 'selected' : ''}>EUR</option>
                                    <option value="GBP" ${payslip?.currency == 'GBP' ? 'selected' : ''}>GBP</option>
                                </select>
                            </div>
                        </div>

                        <div class="d-flex justify-content-end gap-2">
                            <a href="${createLink(action: 'index')}" class="btn btn-outline-secondary">Cancel</a>
                            <button type="submit" class="btn btn-cyan">
                                <i class="bi bi-check-lg me-1"></i> Create Payslip
                            </button>
                        </div>
                    </g:form>
                </div>
            </div>
        </div>

        <!-- Help Panel -->
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-info-circle me-2 text-muted"></i>Help
                    </h5>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-3">
                        Create a new payslip for an employee. The payslip will be saved as a draft until you send it.
                    </p>
                    <ul class="text-muted small mb-0">
                        <li class="mb-2">All required fields are marked with <span class="text-danger">*</span></li>
                        <li class="mb-2">Net amount is automatically calculated</li>
                        <li class="mb-2">After creating, you can send it to the employee</li>
                        <li>Employees can view and download their payslips</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        function calculateNet() {
            const gross = parseFloat(document.querySelector('[name="grossAmount"]').value) || 0;
            const deductions = parseFloat(document.getElementById('deductions').value) || 0;
            document.getElementById('netAmount').value = (gross - deductions).toFixed(2);
        }
    </script>

</body>
</html>
