<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Charts - ReportBurster</title>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Charts</h4>
            <p class="text-muted mb-4">Data visualization with bar, line, pie, and other chart types.</p>
            
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-bar-chart"></i> Chart
                </div>
                <div class="card-body">
                    <rb-chart 
                        id="demoChart"
                        report-code="sample-employees"
                        api-base-url="http://localhost:9090/api/jobman/reporting"
                        api-key="your-api-key"
                        style="height: 300px;"
                    ></rb-chart>
                    
                    <div class="mt-3">
                        <button id="refreshBtn" class="btn btn-outline-primary btn-sm">
                            <i class="bi bi-arrow-clockwise"></i> Refresh Data
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">Usage</div>
                <div class="card-body">
                    <pre class="bg-light p-3 border rounded mb-0"><code>&lt;rb-chart 
    report-code="sample-employees"
    api-base-url="http://localhost:9090/api/jobman/reporting"
    api-key="your-api-key"
&gt;&lt;/rb-chart&gt;</code></pre>
                </div>
            </div>
        </div>
    </div>
    
    <content tag="scripts">
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const chart = document.getElementById('demoChart');
            document.getElementById('refreshBtn').addEventListener('click', () => {
                chart.fetchData({});
            });
        });
    </script>
    </content>
</body>
</html>
