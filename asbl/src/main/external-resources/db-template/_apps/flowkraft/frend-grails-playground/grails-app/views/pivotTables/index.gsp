<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Pivot Tables - ReportBurster</title>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Pivot Tables</h4>
            <p class="text-muted mb-4">Drag-and-drop data analysis with aggregation and grouping.</p>
            
            <div class="card mb-4">
                <div class="card-header">
                    <i class="bi bi-grid-3x3"></i> Pivot Table
                </div>
                <div class="card-body">
                    <rb-pivot-table 
                        id="demoPivot"
                        report-code="sample-employees"
                        api-base-url="http://localhost:9090/api/jobman/reporting"
                        api-key="your-api-key"
                    ></rb-pivot-table>
                    
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
                    <pre class="bg-light p-3 border rounded mb-0"><code>&lt;rb-pivot-table 
    report-code="sample-employees"
    api-base-url="http://localhost:9090/api/jobman/reporting"
    api-key="your-api-key"
&gt;&lt;/rb-pivot-table&gt;</code></pre>
                </div>
            </div>
        </div>
    </div>
    
    <content tag="scripts">
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const pivot = document.getElementById('demoPivot');
            document.getElementById('refreshBtn').addEventListener('click', () => {
                pivot.fetchData({});
            });
        });
    </script>
    </content>
</body>
</html>
