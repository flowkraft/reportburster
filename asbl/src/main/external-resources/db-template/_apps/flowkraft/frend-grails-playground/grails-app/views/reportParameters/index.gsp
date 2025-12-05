<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Parameters - ReportBurster</title>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Report Parameters</h4>
            <p class="text-muted mb-4">Define how users filter and customize reports at runtime.</p>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <i class="bi bi-sliders"></i> Parameter Form
                        </div>
                        <div class="card-body">
                            <rb-parameters 
                                id="demoParams"
                                report-code="sample-employees"
                                api-base-url="http://localhost:9090/api/jobman/reporting"
                                api-key="your-api-key"
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
            
            <div class="card">
                <div class="card-header">Usage</div>
                <div class="card-body">
                    <pre class="bg-light p-3 border rounded mb-0"><code>&lt;rb-parameters 
    report-code="sample-employees"
    api-base-url="http://localhost:9090/api/jobman/reporting"
    api-key="your-api-key"
&gt;&lt;/rb-parameters&gt;</code></pre>
                </div>
            </div>
        </div>
    </div>
    
    <content tag="scripts">
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const params = document.getElementById('demoParams');
            const valuesDisplay = document.getElementById('paramValues');
            
            params.addEventListener('valueChange', function(e) {
                valuesDisplay.textContent = JSON.stringify(e.detail, null, 2);
            });
        });
    </script>
    </content>
</body>
</html>
