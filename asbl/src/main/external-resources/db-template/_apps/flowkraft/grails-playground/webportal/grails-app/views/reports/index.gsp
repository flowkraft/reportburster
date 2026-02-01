<%@ page import="flowkraft.frend.RbUtils" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Reports - ReportBurster</title>
    <style>
        .employee-cards { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .employee-card {
            padding: 1rem 1.5rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
            min-width: 180px;
        }
        .employee-card:hover { border-color: #3b82f6; background: #f0f9ff; }
        .employee-card.active { border-color: #2563eb; background: #dbeafe; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
        .employee-name { font-weight: 600; color: #1e40af; }
        .employee-id { font-size: 0.85rem; color: #64748b; }
        .payslip-container { min-height: 400px; }
        .code-block {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.85rem;
            background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
            color: #d4d4d4;
            border-radius: 8px;
            padding: 1rem;
            overflow-x: auto;
            white-space: pre;
            line-height: 1.5;
            border: 1px solid #3d3d3d;
        }
    </style>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Reports</h4>
            <p class="text-muted mb-4">
                Embed full reports using the <code>&lt;rb-report&gt;</code> component in <code>entity-code</code> mode.
                Click a person's name to view their document.
            </p>

            
            <!-- Bootstrap 5 Tabs -->
            <ul class="nav nav-tabs" id="reportsTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="component-tab" data-bs-toggle="tab" data-bs-target="#component-pane" type="button" role="tab" aria-controls="component-pane" aria-selected="true">
                        <i class="bi bi-file-earmark-text"></i> Report
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="usage-tab" data-bs-toggle="tab" data-bs-target="#usage-pane" type="button" role="tab" aria-controls="usage-pane" aria-selected="false">
                        <i class="bi bi-code-slash"></i> Usage
                    </button>
                </li>
            </ul>
            
            <div class="tab-content border border-top-0 rounded-bottom p-3" id="reportsTabContent">
                <!-- Component Tab -->
                <div class="tab-pane fade show active" id="component-pane" role="tabpanel" aria-labelledby="component-tab">
                    <!-- Employee Selection -->
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Select Employee:</label>
                        <div class="employee-cards" id="employeeCards">
                            <div class="employee-card" data-code="EMP001">
                                <div class="employee-name">Alice Johnson</div>
                                <div class="employee-id">EMP001 • Engineering</div>
                            </div>
                            <div class="employee-card" data-code="EMP002">
                                <div class="employee-name">Bob Smith</div>
                                <div class="employee-id">EMP002 • Sales</div>
                            </div>
                            <div class="employee-card" data-code="EMP003">
                                <div class="employee-name">Carol Williams</div>
                                <div class="employee-id">EMP003 • Marketing</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payslip Display -->
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span>Employee Payslip</span>
                            <button id="refreshBtn" class="btn btn-outline-secondary btn-sm" title="Refresh">
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                        <div class="card-body payslip-container">
                            <div id="placeholder" class="text-center text-muted py-5">
                                <i class="bi bi-file-earmark-text" style="font-size: 3rem; opacity: 0.3;"></i>
                                <p class="mt-3">Select an employee above to view their payslip</p>
                            </div>
                            <rb-report 
                                id="demoReport"
                                report-code="rep-employee-payslip"
                                api-base-url="${RbUtils.apiBaseUrl}"
                                api-key="${RbUtils.apiKey}"
                                style="display: none;"
                                show-print-button
                                print-button-label="Print / Save PDF"
                            ></rb-report>
                        </div>
                    </div>
                </div>
                
                <!-- Usage Tab -->
                <div class="tab-pane fade" id="usage-pane" role="tabpanel" aria-labelledby="usage-tab">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small">HTML Usage with Entity Code</span>
                        <button id="copyUsageBtn" class="btn btn-outline-secondary btn-sm" title="Copy to clipboard">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <pre id="usageCode" class="code-block"><code>&lt;rb-report 
    report-code="rep-employee-payslip"
    entity-code="EMP001"
    api-base-url="&#36;{RbUtils.apiBaseUrl}"
    api-key="&#36;{RbUtils.apiKey}"
&gt;&lt;/rb-report&gt;

&lt;!-- The entity-code attribute specifies which 
     employee's payslip to render. The component 
     fetches data and renders the HTML template 
     server-side for that specific entity. --&gt;</code></pre>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Toast container -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="copyToast" class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle me-1"></i> Copied to clipboard!
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>
    
    <content tag="scripts">
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const copyToast = new bootstrap.Toast(document.getElementById('copyToast'), { delay: 2000 });
            const report = document.getElementById('demoReport');
            const placeholder = document.getElementById('placeholder');
            const cards = document.querySelectorAll('.employee-card');
            let currentEntityCode = null;
            
            function selectEmployee(code) {
                console.log('[reports GSP] selectEmployee called with code:', code);
                
                // Update active state
                cards.forEach(c => c.classList.remove('active'));
                document.querySelector('[data-code="' + code + '"]')?.classList.add('active');
                
                // Show report, hide placeholder
                placeholder.style.display = 'none';
                report.style.display = 'block';
                
                // Set entity code - component will fetch automatically
                currentEntityCode = code;
                console.log('[reports GSP] Setting report.entity-code attribute to:', code);
                report.setAttribute('entity-code', code);
                
                // Log current component state
                console.log('[reports GSP] report element:', report);
                console.log('[reports GSP] report.entityCode (before toggle):', report.entityCode);
                console.log('[reports GSP] report.reportCode:', report.reportCode);
                console.log('[reports GSP] report.apiBaseUrl:', report.apiBaseUrl);
                
                // Force re-fetch by toggling entityCode
                console.log('[reports GSP] Toggling entityCode to trigger re-fetch...');
                report.entityCode = '';
                setTimeout(() => {
                    console.log('[reports GSP] Setting report.entityCode to:', code);
                    report.entityCode = code;
                    console.log('[reports GSP] report.entityCode (after set):', report.entityCode);
                }, 10);
            }
            
            // Employee card click handlers
            cards.forEach(card => {
                card.addEventListener('click', function() {
                    selectEmployee(this.dataset.code);
                });
            });
            
            // Refresh button
            document.getElementById('refreshBtn').addEventListener('click', () => {
                if (currentEntityCode) {
                    report.entityCode = '';
                    setTimeout(() => { report.entityCode = currentEntityCode; }, 10);
                }
            });
            
            // Copy usage button
            document.getElementById('copyUsageBtn').addEventListener('click', function() {
                const text = document.getElementById('usageCode').innerText;
                navigator.clipboard.writeText(text).then(() => {
                    const icon = this.querySelector('i');
                    icon.classList.remove('bi-clipboard');
                    icon.classList.add('bi-check');
                    copyToast.show();
                    setTimeout(() => {
                        icon.classList.remove('bi-check');
                        icon.classList.add('bi-clipboard');
                    }, 2000);
                });
            });
            
            // Auto-select first employee on load (random for variety)
            const codes = ['EMP001', 'EMP002', 'EMP003'];
            const randomCode = codes[Math.floor(Math.random() * codes.length)];
            selectEmployee(randomCode);
        });
    </script>
    </content>
</body>
</html>
