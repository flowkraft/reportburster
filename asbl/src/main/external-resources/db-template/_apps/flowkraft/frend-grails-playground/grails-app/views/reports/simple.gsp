<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Reports (New) - ReportBurster</title>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Reports (Simplified)</h4>
            <p class="text-muted mb-4">
                Using the new <code>&lt;rb-report&gt;</code> component. 
                <strong>Just 3 attributes needed!</strong>
            </p>
            
            <!-- Report Selection -->
            <div class="card mb-4">
                <div class="card-header">Select Report</div>
                <div class="card-body">
                    <select id="reportSelect" class="form-select">
                        <option value="">-- Select a report --</option>
                        <option value="sales-summary">Sales Summary</option>
                        <option value="customer-orders">Customer Orders</option>
                        <option value="inventory-report">Inventory Report</option>
                    </select>
                </div>
            </div>
            
            <!-- The Magic: rb-report Component -->
            <div id="reportContainer" style="display: none;">
                <rb-report id="rbReport"></rb-report>
            </div>
            
            <!-- Code Example -->
            <div class="card mt-4">
                <div class="card-header">Integration Code</div>
                <div class="card-body">
                    <pre><code>&lt;rb-report 
    report-code="sales-summary"
    api-base-url="${grailsApplication.config.reportburster.apiUrl}"
    api-key="${session.apiKey}"&gt;
&lt;/rb-report&gt;</code></pre>
                    <p class="text-muted small mt-2">
                        That's it! The component fetches config & data automatically.
                        Server-side Groovy DSL is the single source of truth.
                    </p>
                </div>
            </div>
        </div>
    </div>
    
    <content tag="scripts">
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const reportSelect = document.getElementById('reportSelect');
            const reportContainer = document.getElementById('reportContainer');
            const rbReport = document.getElementById('rbReport');
            
            // Configuration - in production, these would come from Grails config
            const API_BASE_URL = 'http://localhost:9090/api/jobman/reporting';
            const API_KEY = '${session.apiKey ?: "demo-api-key"}';
            
            reportSelect.addEventListener('change', function() {
                const reportCode = this.value;
                
                if (reportCode) {
                    // Set the 3 required attributes
                    rbReport.setAttribute('report-code', reportCode);
                    rbReport.setAttribute('api-base-url', API_BASE_URL);
                    rbReport.setAttribute('api-key', API_KEY);
                    
                    // Show the report
                    reportContainer.style.display = 'block';
                    
                    // Force reload by resetting reportCode (triggers Svelte reactivity)
                    rbReport.reportCode = '';
                    setTimeout(() => { rbReport.reportCode = reportCode; }, 0);
                } else {
                    reportContainer.style.display = 'none';
                }
            });
        });
    </script>
    </content>
</body>
</html>
