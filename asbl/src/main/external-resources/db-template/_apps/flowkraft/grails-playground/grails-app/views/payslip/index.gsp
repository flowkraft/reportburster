<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Payslips - Admin</title>
    <content tag="title">Payslips</content>
</head>
<body>

    <div class="space-y-4">
        <!-- Header - matches Next.js -->
        <div class="d-flex justify-content-between align-items-center mb-3" id="payslips-header">
            <h1 class="h5 fw-semibold text-dark mb-0" id="payslips-page-title">Payslips</h1>
            <a href="${createLink(action: 'create')}" class="btn btn-sm btn-dark" id="btn-new-payslip">
                <i class="bi bi-plus"></i> New
            </a>
        </div>

        <!-- Search - matches Next.js -->
        <div class="mb-3" id="payslips-search">
            <g:form action="index" method="GET" class="d-inline-block">
                <input type="text" class="form-control form-control-sm" name="search" id="payslips-search-input"
                       value="${params.search}" placeholder="Search..." style="max-width: 200px;"/>
            </g:form>
        </div>

        <!-- Table - matches Next.js structure -->
        <div class="card border" id="payslips-table-card">
            <div class="table-responsive">
                <table class="table mb-0" id="payslips-table">
                    <thead class="bg-light">
                        <tr>
                            <th class="small text-muted text-uppercase">Payslip</th>
                            <th class="small text-muted text-uppercase">Employee</th>
                            <th class="small text-muted text-uppercase">Dept</th>
                            <th class="small text-muted text-uppercase">Period</th>
                            <th class="small text-muted text-uppercase text-end">Net</th>
                            <th class="small text-muted text-uppercase">Status</th>
                            <th style="width: 80px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <g:if test="${payslipList}">
                            <g:each in="${payslipList}" var="payslip" status="i">
                                <tr class="payslip-row" id="payslip-row-${payslip.id}">
                                    <td class="small fw-medium">${payslip.payslipNumber}</td>
                                    <td>
                                        <div class="small">${payslip.employeeName}</div>
                                        <div class="small text-muted">${payslip.employeeId}</div>
                                    </td>
                                    <td class="small text-muted">${payslip.department ?: '-'}</td>
                                    <td class="small text-muted">
                                        <g:formatDate date="${payslip.payPeriodStart}" format="MMM d"/> - 
                                        <g:formatDate date="${payslip.payPeriodEnd}" format="MMM d"/>
                                    </td>
                                    <td class="small fw-medium text-end">${payslip.formatAmount(payslip.netAmount)}</td>
                                    <td>
                                        <span class="badge ${payslip.status in ['viewed', 'downloaded'] ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} small">
                                            ${payslip.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="d-flex justify-content-end gap-1">
                                            <a href="${createLink(action: 'show', id: payslip.id)}" 
                                               class="btn btn-link btn-sm p-1 text-muted" title="View">
                                                <i class="bi bi-eye"></i>
                                            </a>
                                            <a href="${createLink(action: 'edit', id: payslip.id)}" 
                                               class="btn btn-link btn-sm p-1 text-muted" title="Edit">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                            <button type="button" class="btn btn-link btn-sm p-1 text-muted" 
                                                    title="Delete" onclick="confirmDelete(${payslip.id})">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </g:each>
                        </g:if>
                        <g:else>
                            <tr>
                                <td colspan="7" class="text-center py-4 text-muted small">
                                    No payslips found.
                                </td>
                            </tr>
                        </g:else>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Delete Confirmation Modal - matches Next.js dialog -->
    <div class="modal fade" id="deleteModal" tabindex="-1">
        <div class="modal-dialog modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Delete Payslip</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted small mb-0">This cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <g:form action="delete" method="POST" class="d-inline">
                        <input type="hidden" name="id" id="deletePayslipId"/>
                        <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                    </g:form>
                </div>
            </div>
        </div>
    </div>

    <content tag="scripts">
        <script>
            function confirmDelete(id) {
                document.getElementById('deletePayslipId').value = id;
                new bootstrap.Modal(document.getElementById('deleteModal')).show();
            }
        </script>
    </content>

</body>
</html>
