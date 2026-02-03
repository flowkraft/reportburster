<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Edit Invoice - Admin</title>
    <content tag="title">Edit Invoice</content>
</head>
<body>

    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
            <li class="breadcrumb-item">
                <a href="${createLink(action: 'index')}">Invoices</a>
            </li>
            <li class="breadcrumb-item">
                <a href="${createLink(action: 'show', id: invoice?.id)}">${invoice?.invoiceNumber}</a>
            </li>
            <li class="breadcrumb-item active">Edit</li>
        </ol>
    </nav>

    <div class="row">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-pencil me-2 text-muted"></i>Edit Invoice
                    </h5>
                    <span class="badge ${invoice?.statusBadgeClass}">${invoice?.status?.capitalize()}</span>
                </div>
                <div class="card-body">
                    <g:form action="update" id="${invoice?.id}" method="POST">
                        <!-- Customer Information -->
                        <h6 class="text-muted mb-3">Customer Information</h6>
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Customer ID <span class="text-danger">*</span></label>
                                <input type="text" class="form-control ${hasErrors(bean: invoice, field: 'customerId', 'is-invalid')}" 
                                       name="customerId" value="${invoice?.customerId}"/>
                                <g:renderErrors bean="${invoice}" field="customerId"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Customer Name <span class="text-danger">*</span></label>
                                <input type="text" class="form-control ${hasErrors(bean: invoice, field: 'customerName', 'is-invalid')}" 
                                       name="customerName" value="${invoice?.customerName}"/>
                                <g:renderErrors bean="${invoice}" field="customerName"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Customer Email <span class="text-danger">*</span></label>
                                <input type="email" class="form-control ${hasErrors(bean: invoice, field: 'customerEmail', 'is-invalid')}" 
                                       name="customerEmail" value="${invoice?.customerEmail}"/>
                                <g:renderErrors bean="${invoice}" field="customerEmail"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Customer Address</label>
                                <input type="text" class="form-control" name="customerAddress" value="${invoice?.customerAddress}"/>
                            </div>
                        </div>

                        <hr class="my-4"/>

                        <!-- Invoice Dates -->
                        <h6 class="text-muted mb-3">Invoice Dates</h6>
                        <div class="row g-3 mb-4">
                            <div class="col-md-6">
                                <label class="form-label">Issue Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control ${hasErrors(bean: invoice, field: 'issueDate', 'is-invalid')}" 
                                       name="issueDate" value="${invoice?.issueDate ? new java.text.SimpleDateFormat('yyyy-MM-dd').format(invoice.issueDate) : ''}"/>
                                <g:renderErrors bean="${invoice}" field="issueDate"/>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Due Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control ${hasErrors(bean: invoice, field: 'dueDate', 'is-invalid')}" 
                                       name="dueDate" value="${invoice?.dueDate ? new java.text.SimpleDateFormat('yyyy-MM-dd').format(invoice.dueDate) : ''}"/>
                                <g:renderErrors bean="${invoice}" field="dueDate"/>
                            </div>
                        </div>

                        <hr class="my-4"/>

                        <!-- Amount Details -->
                        <h6 class="text-muted mb-3">Amount Details</h6>
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <label class="form-label">Subtotal <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" class="form-control ${hasErrors(bean: invoice, field: 'subtotal', 'is-invalid')}" 
                                           name="subtotal" id="subtotal" value="${invoice?.subtotal}" onchange="calculateTotal()"/>
                                </div>
                                <g:renderErrors bean="${invoice}" field="subtotal"/>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Tax Rate (%)</label>
                                <div class="input-group">
                                    <input type="number" step="0.01" class="form-control" id="taxRate"
                                           name="taxRate" value="${invoice?.taxRate ?: 20}" onchange="calculateTotal()"/>
                                    <span class="input-group-text">%</span>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Tax Amount</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" class="form-control" id="taxAmount"
                                           name="taxAmount" value="${invoice?.taxAmount ?: 0}" readonly/>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Discount</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" class="form-control" id="discount"
                                           name="discount" value="${invoice?.discount ?: 0}" onchange="calculateTotal()"/>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Total Amount</label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" step="0.01" class="form-control fw-bold" id="totalAmount"
                                           name="totalAmount" value="${invoice?.totalAmount}" readonly/>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Currency</label>
                                <select class="form-select" name="currency">
                                    <option value="USD" ${invoice?.currency == 'USD' ? 'selected' : ''}>USD</option>
                                    <option value="EUR" ${invoice?.currency == 'EUR' ? 'selected' : ''}>EUR</option>
                                    <option value="GBP" ${invoice?.currency == 'GBP' ? 'selected' : ''}>GBP</option>
                                </select>
                            </div>
                        </div>

                        <hr class="my-4"/>

                        <!-- Status and Notes -->
                        <div class="row g-3 mb-4">
                            <div class="col-md-4">
                                <label class="form-label">Status</label>
                                <select class="form-select" name="status">
                                    <option value="draft" ${invoice?.status == 'draft' ? 'selected' : ''}>Draft</option>
                                    <option value="sent" ${invoice?.status == 'sent' ? 'selected' : ''}>Sent</option>
                                    <option value="paid" ${invoice?.status == 'paid' ? 'selected' : ''}>Paid</option>
                                    <option value="overdue" ${invoice?.status == 'overdue' ? 'selected' : ''}>Overdue</option>
                                    <option value="cancelled" ${invoice?.status == 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </div>
                            <div class="col-md-8">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" name="notes" rows="1">${invoice?.notes}</textarea>
                            </div>
                        </div>

                        <div class="d-flex justify-content-end gap-2">
                            <a href="${createLink(action: 'show', id: invoice?.id)}" class="btn btn-outline-secondary">Cancel</a>
                            <button type="submit" class="btn btn-violet">
                                <i class="bi bi-check-lg me-1"></i> Save Changes
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
                        Edit the invoice details. Changes will be saved immediately.
                    </p>
                    <ul class="text-muted small mb-0">
                        <li class="mb-2">All required fields are marked with <span class="text-danger">*</span></li>
                        <li class="mb-2">Tax and total are automatically calculated</li>
                        <li>Changing status won't automatically notify the customer</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        function calculateTotal() {
            const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
            const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
            const discount = parseFloat(document.getElementById('discount').value) || 0;
            
            const taxAmount = subtotal * (taxRate / 100);
            const total = subtotal + taxAmount - discount;
            
            document.getElementById('taxAmount').value = taxAmount.toFixed(2);
            document.getElementById('totalAmount').value = total.toFixed(2);
        }
    </script>

</body>
</html>
