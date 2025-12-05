<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Tabulator - ReportBurster</title>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Tabulator</h4>
            <p class="text-muted mb-4">Interactive data tables with sorting, filtering, and pagination.</p>
            
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-table"></i> Data Table
                </div>
                <div class="card-body">
                    <rb-tabulator 
                        id="demoTable"
                        report-code="sample-employees"
                        api-base-url="http://localhost:9090/api/jobman/reporting"
                        api-key="your-api-key"
                    ></rb-tabulator>
                    
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
                    <pre class="bg-light p-3 border rounded mb-0"><code>&lt;rb-tabulator 
    report-code="sample-employees"
    api-base-url="http://localhost:9090/api/jobman/reporting"
    api-key="your-api-key"
&gt;&lt;/rb-tabulator&gt;</code></pre>
                </div>
            </div>
        </div>
    </div>
    
    <content tag="scripts">
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const table = document.getElementById('demoTable');
            document.getElementById('refreshBtn').addEventListener('click', () => {
                table.fetchData({});
            });
        });
    </script>
    </content>
</body>
</html>

