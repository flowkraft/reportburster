<%@ page import="flowkraft.frend.RbUtils" %>
<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Parameters - ReportBurster</title>
    <style>
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
        .code-block .comment { color: #6a9955; }
        .code-block .keyword { color: #569cd6; }
        .code-block .string { color: #ce9178; }
        .code-block .property { color: #9cdcfe; }
        
        /* Filter state styles */
        #dataTableCard.filtered .card-header {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
            border-bottom-color: #ffc107;
        }
        #dataTableCard.filtered {
            border-color: #ffc107;
            box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.25);
        }
        #dataTableCard.filtered .card-footer {
            background-color: #fff3cd;
            border-top-color: #ffc107;
            color: #856404;
        }
        .filter-param {
            display: inline-block;
            background: #fff;
            border: 1px solid #ffc107;
            border-radius: 4px;
            padding: 2px 8px;
            margin: 0 4px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Report Parameters</h4>
            <p class="text-muted mb-4">Define how users filter and customize reports at runtime.</p>
            
            <!-- Bootstrap 5 Tabs -->
            <ul class="nav nav-tabs" id="paramsTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="component-tab" data-bs-toggle="tab" data-bs-target="#component-pane" type="button" role="tab" aria-controls="component-pane" aria-selected="true">
                        <i class="bi bi-sliders"></i> Parameters
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
            
            <div class="tab-content border border-top-0 rounded-bottom p-3" id="paramsTabContent">
                <!-- Component Tab -->
                <div class="tab-pane fade show active" id="component-pane" role="tabpanel" aria-labelledby="component-tab">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="card mb-3">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <span>Parameter Form</span>
                                    <button id="refreshBtn" class="btn btn-outline-secondary btn-sm" title="Refresh">
                                        <i class="bi bi-arrow-clockwise"></i>
                                    </button>
                                </div>
                                <div class="card-body">
                                    <rb-parameters 
                                        id="demoParams"
                                        report-code="par-employee-hire-dates"
                                        api-base-url="${RbUtils.apiBaseUrl}"
                                        api-key="${RbUtils.apiKey}"
                                    ></rb-parameters>
                                    <hr>
                                    <button id="submitBtn" class="btn btn-primary">Run Report</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">Current Values</div>
                                <div class="card-body">
                                    <pre id="paramValues" style="background: var(--bs-tertiary-bg); padding: 1rem; border-radius: 4px; margin: 0;">{ }</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Data Table Section -->
                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="card mb-3" id="dataTableCard">
                                <div class="card-header d-flex justify-content-between align-items-center" id="dataTableHeader">
                                    <div>
                                        <i class="bi bi-table"></i> 
                                        <span id="tableTitle">Sample Data</span>
                                        <span id="filterBadge" class="badge bg-warning text-dark ms-2" style="display: none;">
                                            <i class="bi bi-funnel-fill"></i> Filtered
                                        </span>
                                    </div>
                                    <div>
                                        <span id="recordCount" class="text-muted me-3">Loading...</span>
                                        <button id="clearFiltersBtn" class="btn btn-outline-warning btn-sm" style="display: none;" title="Clear filters and show all data">
                                            <i class="bi bi-x-circle"></i> Clear Filters
                                        </button>
                                    </div>
                                </div>
                                <div class="card-body" style="max-height: 450px; overflow: auto;">
                                    <rb-tabulator 
                                        id="dataTable"
                                        report-code="par-employee-hire-dates"
                                        api-base-url="${RbUtils.apiBaseUrl}"
                                        api-key="${RbUtils.apiKey}"
                                    ></rb-tabulator>
                                </div>
                                <div class="card-footer text-muted small" id="filterStatus">
                                    <i class="bi bi-info-circle"></i> Showing all records. Use the parameters above and click "Run Report" to filter.
                                </div>
                            </div>
                        </div>
                    </div>
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
                    <pre id="usageCode" class="bg-light p-3 border rounded mb-0"><code>&lt;rb-parameters 
    report-code="par-employee-hire-dates"
    api-base-url="&#36;{RbUtils.apiBaseUrl}"
    api-key="&#36;{RbUtils.apiKey}"
&gt;&lt;/rb-parameters&gt;</code></pre>
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
            const params = document.getElementById('demoParams');
            const valuesDisplay = document.getElementById('paramValues');
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
                console.log('[reportParameters GSP] updateConfigDisplay called');
                console.log('[reportParameters GSP] params.configDsl:', params.configDsl ? params.configDsl.length + ' chars' : 'null/empty');
                console.log('[reportParameters GSP] params.parameters:', params.parameters);
                if (params.configDsl) {
                    const escaped = params.configDsl
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    configCodeEl.innerHTML = '<code>' + escaped + '</code>';
                    console.log('[reportParameters GSP] Configuration tab updated with DSL');
                } else {
                    console.warn('[reportParameters GSP] No configDsl available!');
                }
            }
            
            // Listen for config events (both for backward compatibility)
            console.log('[reportParameters GSP] Setting up event listeners on params element');
            params.addEventListener('configLoaded', function(e) {
                console.log('[reportParameters GSP] configLoaded event received:', e.detail);
                updateConfigDisplay();
            });
            params.addEventListener('configFetched', function(e) {
                console.log('[reportParameters GSP] configFetched event received:', e.detail);
                updateConfigDisplay();
            });
            params.addEventListener('fetchError', function(e) {
                console.error('[reportParameters GSP] fetchError event received:', e.detail);
            });
            
            // Also check immediately in case component already loaded before listener was attached
            console.log('[reportParameters GSP] Setting up fallback timeouts');
            setTimeout(function() {
                console.log('[reportParameters GSP] 100ms timeout check');
                updateConfigDisplay();
            }, 100);
            setTimeout(function() {
                console.log('[reportParameters GSP] 500ms timeout check');
                updateConfigDisplay();
            }, 500);
            setTimeout(function() {
                console.log('[reportParameters GSP] 1000ms timeout check');
                updateConfigDisplay();
            }, 1000);
            
            params.addEventListener('valueChange', function(e) {
                console.log('[reportParameters GSP] valueChange event received:', e.detail);
                valuesDisplay.textContent = JSON.stringify(e.detail, null, 2);
            });
            
            // Refresh button
            document.getElementById('refreshBtn').addEventListener('click', () => {
                if (params.fetchConfig) {
                    params.fetchConfig();
                }
            });
            
            // Copy config button
            document.getElementById('copyConfigBtn').addEventListener('click', function() {
                copyWithFeedback(this, document.getElementById('configCode').innerText);
            });
            
            // Copy usage button
            document.getElementById('copyUsageBtn').addEventListener('click', function() {
                copyWithFeedback(this, document.getElementById('usageCode').innerText);
            });
            
            // Run Report button - fetches filtered data based on parameter values
            document.getElementById('submitBtn').addEventListener('click', async function() {
                const btn = this;
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Loading...';
                btn.disabled = true;
                
                try {
                    // Get current parameter values from the form
                    const paramValues = params.getValues ? params.getValues() : {};
                    console.log('[reportParameters GSP] Running report with params:', paramValues);
                    
                    // Build query string from parameters
                    const queryParams = new URLSearchParams();
                    const appliedFilters = [];
                    for (const [key, value] of Object.entries(paramValues)) {
                        if (value !== null && value !== undefined && value !== '') {
                            queryParams.append(key, value);
                            appliedFilters.push({ key, value });
                        }
                    }
                    
                    // Fetch filtered data from backend
                    const apiBaseUrl = '${RbUtils.apiBaseUrl}';
                    const apiKey = '${RbUtils.apiKey}';
                    const reportCode = 'par-employee-hire-dates';
                    
                    const headers = { 'Content-Type': 'application/json' };
                    // TEMP: API key disabled for rollback
                    // if (apiKey) headers['X-API-Key'] = apiKey;
                    
                    const dataUrl = apiBaseUrl + '/reports/' + reportCode + '/data?' + queryParams.toString();
                    console.log('[reportParameters GSP] Fetching filtered data from:', dataUrl);
                    
                    const response = await fetch(dataUrl, { headers });
                    if (!response.ok) throw new Error('Data fetch failed: ' + response.status);
                    
                    const result = await response.json();
                    const data = Array.isArray(result) ? result : (result.reportData || []);
                    
                    console.log('[reportParameters GSP] Filtered data received:', data.length, 'records');
                    
                    // Update the single tabulator with filtered data
                    const dataTable = document.getElementById('dataTable');
                    const dataTableCard = document.getElementById('dataTableCard');
                    const filterBadge = document.getElementById('filterBadge');
                    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
                    const recordCount = document.getElementById('recordCount');
                    const filterStatus = document.getElementById('filterStatus');
                    const tableTitle = document.getElementById('tableTitle');
                    
                    // Store original count for comparison (get from tabulator if available)
                    const originalCount = window.originalDataCount || data.length;
                    
                    // Update table data
                    if (dataTable) {
                        dataTable.data = data;
                    }
                    
                    // Update UI to show filtered state
                    if (appliedFilters.length > 0) {
                        dataTableCard.classList.add('filtered');
                        filterBadge.style.display = 'inline-block';
                        clearFiltersBtn.style.display = 'inline-block';
                        tableTitle.textContent = 'Filtered Results';
                        recordCount.innerHTML = '<strong>' + data.length + '</strong> of ' + originalCount + ' records';
                        
                        // Build filter description
                        let filterDesc = '<i class="bi bi-funnel-fill text-warning"></i> <strong>Filters applied:</strong> ';
                        filterDesc += appliedFilters.map(f => '<span class="filter-param">' + f.key + ' = ' + f.value + '</span>').join(' ');
                        filterStatus.innerHTML = filterDesc;
                    }
                    
                } catch (error) {
                    console.error('[reportParameters GSP] Error running report:', error);
                    document.getElementById('filterStatus').innerHTML = 
                        '<i class="bi bi-x-circle text-danger"></i> <strong>Error:</strong> ' + error.message;
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            });
            
            // Clear Filters button - reloads original data
            document.getElementById('clearFiltersBtn').addEventListener('click', async function() {
                const dataTable = document.getElementById('dataTable');
                const dataTableCard = document.getElementById('dataTableCard');
                const filterBadge = document.getElementById('filterBadge');
                const clearFiltersBtn = document.getElementById('clearFiltersBtn');
                const recordCount = document.getElementById('recordCount');
                const filterStatus = document.getElementById('filterStatus');
                const tableTitle = document.getElementById('tableTitle');
                
                // Reset UI
                dataTableCard.classList.remove('filtered');
                filterBadge.style.display = 'none';
                clearFiltersBtn.style.display = 'none';
                tableTitle.textContent = 'Sample Data';
                filterStatus.innerHTML = '<i class="bi bi-info-circle"></i> Showing all records. Use the parameters above and click "Run Report" to filter.';
                
                // Reload original data
                if (dataTable && dataTable.fetchData) {
                    dataTable.fetchData({});
                } else {
                    // Fallback: reload the page section
                    location.reload();
                }
            });
            
            // Track original data count when tabulator loads
            const dataTable = document.getElementById('dataTable');
            if (dataTable) {
                dataTable.addEventListener('dataLoaded', function(e) {
                    const data = e.detail && e.detail.data ? e.detail.data : [];
                    window.originalDataCount = Array.isArray(data) ? data.length : 0;
                    document.getElementById('recordCount').textContent = window.originalDataCount + ' records';
                    console.log('[reportParameters GSP] Original data loaded:', window.originalDataCount, 'records');
                });
                // Also try ready event
                dataTable.addEventListener('ready', function(e) {
                    setTimeout(() => {
                        if (dataTable.data && Array.isArray(dataTable.data)) {
                            window.originalDataCount = dataTable.data.length;
                            document.getElementById('recordCount').textContent = window.originalDataCount + ' records';
                        }
                    }, 200);
                });
            }
        });
    </script>
    </content>
</body>
</html>
