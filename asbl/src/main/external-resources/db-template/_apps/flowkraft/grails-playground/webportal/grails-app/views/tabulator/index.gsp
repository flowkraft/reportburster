<%@ page import="flowkraft.frend.RbUtils" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Tabulator - ReportBurster</title>
    <style>
        rb-tabulator { display: block; width: 100%; }
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
            max-height: 400px;
        }
    </style>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Tabulator</h4>
            <p class="text-muted mb-4">Interactive data tables with sorting, filtering, and pagination.</p>
            
            <!-- Bootstrap 5 Tabs -->
            <ul class="nav nav-tabs" id="tabulatorTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="component-tab" data-bs-toggle="tab" data-bs-target="#component-pane" type="button" role="tab" aria-controls="component-pane" aria-selected="true">
                        <i class="bi bi-table"></i> Data Table
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="config-tab" data-bs-toggle="tab" data-bs-target="#config-pane" type="button" role="tab" aria-controls="config-pane" aria-selected="false">
                        <i class="bi bi-gear"></i> Configuration
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="usage-tab" data-bs-toggle="tab" data-bs-target="#usage-pane" type="button" role="tab" aria-controls="usage-pane" aria-selected="false">
                        <i class="bi bi-code-slash"></i> Usage
                    </button>
                </li>
            </ul>
            
            <div class="tab-content border border-top-0 rounded-bottom p-3" id="tabulatorTabContent">
                <!-- Component Tab -->
                <div class="tab-pane fade show active" id="component-pane" role="tabpanel" aria-labelledby="component-tab">
                    <div class="d-flex justify-content-end mb-2">
                        <button id="refreshBtn" class="btn btn-outline-secondary btn-sm" title="Refresh">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                    <rb-tabulator 
                        id="demoTable"
                        report-code="g-scr2htm-trend"
                        api-base-url="${RbUtils.apiBaseUrl}"
                        api-key="${RbUtils.apiKey}"
                    ></rb-tabulator>
                </div>
                
                <!-- Configuration Tab -->
                <div class="tab-pane fade" id="config-pane" role="tabpanel" aria-labelledby="config-tab">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <button id="copyConfigBtn" class="btn btn-outline-secondary btn-sm" title="Copy to clipboard">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <pre id="configCode" class="code-block"><code class="text-muted">Loading configuration...</code></pre>
                </div>
                
                <!-- Usage Tab -->
                <div class="tab-pane fade" id="usage-pane" role="tabpanel" aria-labelledby="usage-tab">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="text-muted small">HTML Usage</span>
                        <button id="copyUsageBtn" class="btn btn-outline-secondary btn-sm" title="Copy to clipboard">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <pre id="usageCode" class="bg-light p-3 border rounded mb-0"><code>&lt;rb-tabulator 
    report-code="g-scr2htm-trend"
    api-base-url="&#36;{RbUtils.apiBaseUrl}"
    api-key="&#36;{RbUtils.apiKey}"
&gt;&lt;/rb-tabulator&gt;</code></pre>
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
            const component = document.getElementById('demoTable');
            const configCodeEl = document.getElementById('configCode');
            
            function copyWithFeedback(btn, text) {
                navigator.clipboard.writeText(text).then(() => {
                    const icon = btn.querySelector('i');
                    icon.classList.remove('bi-clipboard');
                    icon.classList.add('bi-check');
                    copyToast.show();
                    setTimeout(() => {
                        icon.classList.remove('bi-check');
                        icon.classList.add('bi-clipboard');
                    }, 2000);
                });
            }
            
            function updateConfigDisplay() {
                if (component.configDsl) {
                    const escaped = component.configDsl
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    configCodeEl.innerHTML = '<code>' + escaped + '</code>';
                }
            }
            
            // Listen for component events
            component.addEventListener('configLoaded', updateConfigDisplay);
            component.addEventListener('dataFetched', updateConfigDisplay);
            component.addEventListener('tableBuilt', updateConfigDisplay);
            
            // Also check immediately in case component already loaded before listener was attached
            setTimeout(updateConfigDisplay, 100);
            setTimeout(updateConfigDisplay, 500);
            
            // Refresh button
            document.getElementById('refreshBtn').addEventListener('click', () => {
                component.fetchData({});
            });
            
            // Copy config button
            document.getElementById('copyConfigBtn').addEventListener('click', function() {
                copyWithFeedback(this, component.configDsl || '');
            });
            
            // Copy usage button
            document.getElementById('copyUsageBtn').addEventListener('click', function() {
                copyWithFeedback(this, document.getElementById('usageCode').innerText);
            });
        });
    </script>
    </content>
</body>
</html>

