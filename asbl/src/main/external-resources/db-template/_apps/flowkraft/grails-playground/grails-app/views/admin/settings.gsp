<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="admin"/>
    <title>Settings - Admin</title>
    <content tag="title">Settings</content>
</head>
<body>

    <div class="mb-4">
        <h1 id="settings-page-title" class="h5 fw-semibold text-dark">Settings</h1>
        <p class="text-muted small mb-0">Configure your application preferences</p>
    </div>

    <div class="row g-3" id="settings-cards-grid">
        <!-- Company Settings - matches Next.js -->
        <div class="col-md-6 col-lg-4">
            <div class="card h-100" id="settings-card-company">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <i class="bi bi-building text-muted"></i>
                        <h6 class="fw-medium mb-0">Company</h6>
                    </div>
                    <g:form action="saveSettings" method="POST">
                        <input type="hidden" name="category" value="company"/>
                        <div class="mb-2">
                            <label class="form-label small text-muted" for="companyName">Name</label>
                            <input type="text" class="form-control form-control-sm" id="companyName" 
                                   name="setting.company.name" 
                                   value="${companySettings?.find { it.key == 'company.name' }?.value ?: ''}"
                                   placeholder="FlowKraft Inc."/>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-muted" for="companyEmail">Email</label>
                            <input type="email" class="form-control form-control-sm" id="companyEmail" 
                                   name="setting.company.email" 
                                   value="${companySettings?.find { it.key == 'company.email' }?.value ?: ''}"
                                   placeholder="admin@company.com"/>
                        </div>
                        <button type="submit" class="btn btn-sm btn-dark w-100" id="btn-save-company">Save</button>
                    </g:form>
                </div>
            </div>
        </div>

        <!-- Preferences Settings - matches Next.js -->
        <div class="col-md-6 col-lg-4">
            <div class="card h-100" id="settings-card-preferences">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <i class="bi bi-gear text-muted"></i>
                        <h6 class="fw-medium mb-0">Preferences</h6>
                    </div>
                    <g:form action="saveSettings" method="POST">
                        <input type="hidden" name="category" value="preferences"/>
                        <div class="mb-2">
                            <label class="form-label small text-muted" for="defaultCurrency">Currency</label>
                            <g:set var="currentCurrency" value="${preferenceSettings?.find { it.key == 'preferences.currency' }?.value ?: 'USD'}"/>
                            <select class="form-select form-select-sm" id="defaultCurrency" name="setting.preferences.currency">
                                <option value="USD" ${currentCurrency == 'USD' ? 'selected' : ''}>USD</option>
                                <option value="EUR" ${currentCurrency == 'EUR' ? 'selected' : ''}>EUR</option>
                                <option value="GBP" ${currentCurrency == 'GBP' ? 'selected' : ''}>GBP</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small text-muted" for="dateFormat">Date Format</label>
                            <g:set var="currentDateFormat" value="${preferenceSettings?.find { it.key == 'preferences.dateFormat' }?.value ?: 'MM/dd/yyyy'}"/>
                            <select class="form-select form-select-sm" id="dateFormat" name="setting.preferences.dateFormat">
                                <option value="MM/DD/YYYY" ${currentDateFormat == 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY" ${currentDateFormat == 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD" ${currentDateFormat == 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-sm btn-dark w-100" id="btn-save-preferences">Save</button>
                    </g:form>
                </div>
            </div>
        </div>

        <!-- Payment Settings - matches Next.js -->
        <div class="col-md-6 col-lg-4">
            <div class="card h-100" id="settings-card-payment">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center gap-2 mb-3">
                        <i class="bi bi-credit-card text-muted"></i>
                        <h6 class="fw-medium mb-0">Payment</h6>
                    </div>
                    <g:form action="saveSettings" method="POST">
                        <input type="hidden" name="category" value="payment"/>
                        <div class="mb-3">
                            <label class="form-label small text-muted" for="paymentProcessor">Default Processor</label>
                            <g:set var="currentProcessor" value="${paymentSettings?.find { it.key == 'payment.processor' }?.value ?: 'stripe'}"/>
                            <select class="form-select form-select-sm" id="paymentProcessor" name="setting.payment.processor">
                                <option value="stripe" ${currentProcessor == 'stripe' ? 'selected' : ''}>Stripe</option>
                                <option value="paypal" ${currentProcessor == 'paypal' ? 'selected' : ''}>PayPal</option>
                                <option value="bank" ${currentProcessor == 'bank' ? 'selected' : ''}>Bank Transfer</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-sm btn-dark w-100" id="btn-save-payment">Save</button>
                    </g:form>
                </div>
            </div>
        </div>
    </div>

</body>
</html>
