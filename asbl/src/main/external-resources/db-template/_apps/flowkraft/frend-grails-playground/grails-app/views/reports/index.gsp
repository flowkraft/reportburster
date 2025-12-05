<!DOCTYPE html>
<html>
<head>
    <meta name="layout" content="main"/>
    <title>Reports - ReportBurster</title>
</head>
<body>
    <div class="row mt-4">
        <div class="col-12">
            <h4 class="mb-3">Reports</h4>
            <p class="text-muted mb-4">Complete reports combining parameters, data tables, and visualizations.</p>
            
            <!-- Parameters Section -->
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Report Parameters</span>
                    <button id="runReportBtn" class="btn btn-primary btn-sm" disabled>
                        <span id="btnSpinner" class="spinner-border spinner-border-sm d-none" role="status"></span>
                        <i id="btnIcon" class="bi bi-play-fill"></i> Run Report
                    </button>
                </div>
                <div class="card-body">
                    <rb-parameters id="reportParams"></rb-parameters>
                </div>
            </div>
            
            <!-- Error Alert (hidden by default) -->
            <div id="errorAlert" class="alert alert-danger d-none" role="alert">
                <strong>Error:</strong> <span id="errorMessage"></span>
            </div>
            
            <!-- Results Section (hidden until report runs) -->
            <div id="resultsSection" style="display: none;">
                <div class="row">
                    <div class="col-md-8 mb-4">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <span>Data</span>
                                <small id="queryStats" class="text-muted"></small>
                            </div>
                            <div class="card-body">
                                <rb-tabulator id="reportTable"></rb-tabulator>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="card">
                            <div class="card-header">Summary Chart</div>
                            <div class="card-body">
                                <rb-chart id="reportChart" type="bar" style="height: 250px;"></rb-chart>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <content tag="scripts">
    <script>
        /**
         * Reports Page Controller
         * 
         * Data Fetching Pattern:
         * 1. User fills in parameters via <rb-parameters>
         * 2. User clicks "Run Report" button
         * 3. This page fetches data from /reports/fetchData (Grails endpoint)
         * 4. Grails proxies the request to ReportBurster backend (/jobman/reporting/fetch-data)
         * 5. Response data is passed to <rb-tabulator> and <rb-chart> components
         * 
         * The web components (<rb-parameters>, <rb-tabulator>, <rb-chart>) 
         * are PURE PRESENTATION - they don't fetch data themselves.
         * The HOST PAGE is responsible for data fetching.
         */
        document.addEventListener('DOMContentLoaded', function() {
            const params = document.getElementById('reportParams');
            const runBtn = document.getElementById('runReportBtn');
            const btnSpinner = document.getElementById('btnSpinner');
            const btnIcon = document.getElementById('btnIcon');
            const resultsSection = document.getElementById('resultsSection');
            const errorAlert = document.getElementById('errorAlert');
            const errorMessage = document.getElementById('errorMessage');
            const queryStats = document.getElementById('queryStats');
            const table = document.getElementById('reportTable');
            const chart = document.getElementById('reportChart');
            
            // Current parameter values
            let currentParams = {};
            
            // Define report parameters
            params.parameters = [
                { 
                    id: 'year', 
                    type: 'select', 
                    label: 'Year', 
                    uiHints: { 
                        control: 'select', 
                        options: [
                            { value: '2024', label: '2024' },
                            { value: '2025', label: '2025' }
                        ]
                    }, 
                    defaultValue: '2025' 
                },
                { 
                    id: 'region', 
                    type: 'select', 
                    label: 'Region',
                    uiHints: { 
                        control: 'select', 
                        options: [
                            { value: 'all', label: 'All Regions' },
                            { value: 'north', label: 'North' },
                            { value: 'south', label: 'South' }
                        ]
                    }, 
                    defaultValue: 'all' 
                }
            ];
            
            // Listen for parameter validity changes
            params.addEventListener('validChange', e => {
                runBtn.disabled = !e.detail;
            });
            
            // Listen for parameter value changes
            params.addEventListener('valueChange', e => {
                currentParams = e.detail;
            });
            
            // Helper: Show loading state
            function setLoading(loading) {
                runBtn.disabled = loading;
                btnSpinner.classList.toggle('d-none', !loading);
                btnIcon.classList.toggle('d-none', loading);
            }
            
            // Helper: Show error
            function showError(message) {
                errorMessage.textContent = message;
                errorAlert.classList.remove('d-none');
                resultsSection.style.display = 'none';
            }
            
            // Helper: Hide error
            function hideError() {
                errorAlert.classList.add('d-none');
            }
            
            /**
             * Fetch report data from Grails backend.
             * 
             * @param {Object} params - Query parameters
             * @returns {Promise<Object>} - { reportData, reportColumnNames, executionTimeMillis, ... }
             */
            async function fetchReportData(params) {
                const queryString = new URLSearchParams(params).toString();
                const response = await fetch('/reports/fetchData?' + queryString, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || 'Failed to fetch report data');
                }
                
                return response.json();
            }
            
            /**
             * Fallback: Get sample data for demo.
             */
            async function fetchSampleData() {
                const response = await fetch('/reports/sampleData');
                return response.json();
            }
            
            // Run Report button click handler
            runBtn.addEventListener('click', async function() {
                hideError();
                setLoading(true);
                
                try {
                    // Try to fetch from backend; fallback to sample data if unavailable
                    let result;
                    try {
                        result = await fetchReportData(currentParams);
                    } catch (backendError) {
                        console.warn('Backend unavailable, using sample data:', backendError);
                        result = await fetchSampleData();
                    }
                    
                    // Show results section
                    resultsSection.style.display = 'block';
                    
                    // Update stats
                    queryStats.textContent = result.totalRows + ' rows in ' + result.executionTimeMillis + 'ms';
                    
                    // Generate columns from column names if not provided
                    const columns = result.reportColumnNames.map(name => ({
                        title: name.charAt(0).toUpperCase() + name.slice(1),
                        field: name,
                        formatter: ['revenue', 'expenses', 'profit', 'salary', 'amount'].includes(name.toLowerCase()) 
                            ? 'money' : undefined
                    }));
                    
                    // Populate table
                    table.columns = columns;
                    table.data = result.reportData;
                    
                    // Populate chart (assuming first column is labels, rest are numeric)
                    if (result.reportData.length > 0) {
                        const labelField = result.reportColumnNames[0];
                        const numericFields = result.reportColumnNames.slice(1).filter(name => 
                            typeof result.reportData[0][name] === 'number'
                        );
                        
                        const colors = [
                            'rgba(34, 167, 200, 0.7)',
                            'rgba(52, 211, 153, 0.7)',
                            'rgba(251, 146, 60, 0.7)',
                            'rgba(168, 85, 247, 0.7)'
                        ];
                        
                        chart.data = {
                            labels: result.reportData.map(d => d[labelField]),
                            datasets: numericFields.slice(0, 4).map((field, i) => ({
                                label: field.charAt(0).toUpperCase() + field.slice(1),
                                data: result.reportData.map(d => d[field]),
                                backgroundColor: colors[i % colors.length]
                            }))
                        };
                    }
                    
                } catch (error) {
                    showError(error.message);
                } finally {
                    setLoading(false);
                }
            });
        });
    </script>
    </content>
</body>
</html>
