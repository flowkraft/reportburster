<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Invoices - Admin</title>
    <content tag="title">Invoices</content>
</head>
<body>

    <div class="space-y-4">
        <!-- Header - matches Next.js -->
        <div class="d-flex justify-content-between align-items-center mb-3" id="invoices-header">
            <h1 class="h5 fw-semibold text-dark mb-0" id="invoices-page-title">Invoices</h1>
            <a href="${createLink(action: 'create')}" class="btn btn-sm btn-dark" id="btn-new-invoice">
                <i class="bi bi-plus"></i> New
            </a>
        </div>

        <!-- Search - matches Next.js -->
        <div class="mb-3" id="invoices-search">
            <g:form action="index" method="GET" class="d-inline-block">
                <input type="text" class="form-control form-control-sm" name="search" id="invoices-search-input"
                       value="${params.search}" placeholder="Search..." style="max-width: 200px;"/>
            </g:form>
        </div>

        <!-- Table - matches Next.js structure -->
        <div class="card border" id="invoices-table-card">
            <div class="table-responsive">
                <table class="table mb-0" id="invoices-table">
                    <thead class="bg-light">
                        <tr>
                            <th class="small text-muted text-uppercase">Invoice</th>
                            <th class="small text-muted text-uppercase">Customer</th>
                            <th class="small text-muted text-uppercase">Due</th>
                            <th class="small text-muted text-uppercase text-end">Amount</th>
                            <th class="small text-muted text-uppercase">Status</th>
                            <th style="width: 80px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <g:if test="${invoiceList}">
                            <g:each in="${invoiceList}" var="invoice" status="i">
                                <tr class="invoice-row" id="invoice-row-${invoice.id}">
                                    <td class="small fw-medium">${invoice.invoiceNumber}</td>
                                    <td>
                                        <div class="small">${invoice.customerName}</div>
                                        <div class="small text-muted">${invoice.customerEmail}</div>
                                    </td>
                                    <td class="small text-muted">
                                        <g:formatDate date="${invoice.dueDate}" format="MMM d, yyyy"/>
                                    </td>
                                    <td class="small fw-medium text-end">${invoice.formatAmount(invoice.totalAmount)}</td>
                                    <td>
                                        <span class="badge ${invoice.status == 'paid' ? 'bg-success-subtle text-success' : invoice.status == 'overdue' ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'} small">
                                            ${invoice.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="d-flex justify-content-end gap-1">
                                            <a href="${createLink(action: 'show', id: invoice.id)}" 
                                               class="btn btn-link btn-sm p-1 text-muted" title="View">
                                                <i class="bi bi-eye"></i>
                                            </a>
                                            <a href="${createLink(action: 'edit', id: invoice.id)}" 
                                               class="btn btn-link btn-sm p-1 text-muted" title="Edit">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                            <button type="button" class="btn btn-link btn-sm p-1 text-muted" 
                                                    title="Delete" onclick="confirmDelete(${invoice.id})">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </g:each>
                        </g:if>
                        <g:else>
                            <tr>
                                <td colspan="6" class="text-center py-4 text-muted small">
                                    No invoices found.
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
                    <h5 class="modal-title">Delete Invoice</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p class="text-muted small mb-0">This cannot be undone.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <g:form action="delete" method="POST" class="d-inline">
                        <input type="hidden" name="id" id="deleteInvoiceId"/>
                        <button type="submit" class="btn btn-sm btn-danger">Delete</button>
                    </g:form>
                </div>
            </div>
        </div>
    </div>

    <content tag="scripts">
        <script>
            function confirmDelete(id) {
                document.getElementById('deleteInvoiceId').value = id;
                new bootstrap.Modal(document.getElementById('deleteModal')).show();
            }
        </script>
    </content>

</body>
</html>
