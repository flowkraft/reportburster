<!--
 | ReportBurster Integration - Report View
 |
 | This template demonstrates the new <rb-report> component
 | that simplifies integration to just 3 attributes.
 |
-->

<?php 
// Get configuration from WordPress options or environment
$api_base_url = get_option('reportburster_api_url', 'http://localhost:9090/api/jobman/reporting');
$api_key = get_option('reportburster_api_key', '');
?>

<div class="reportburster-integration wrap">
    <h1><?php _e('Reports', 'reportburster-integration'); ?></h1>
    <p class="description"><?php _e('Select a report to view. The rb-report component handles everything automatically.', 'reportburster-integration'); ?></p>

    <!-- Report Selection -->
    <div class="card" style="margin: 20px 0; padding: 15px;">
        <label for="report-select" style="font-weight: bold;"><?php _e('Select Report:', 'reportburster-integration'); ?></label>
        <select id="report-select" class="regular-text" style="margin-left: 10px;">
            <option value=""><?php _e('-- Select a report --', 'reportburster-integration'); ?></option>
            <option value="sales-summary">Sales Summary</option>
            <option value="customer-orders">Customer Orders</option>
            <option value="inventory-report">Inventory Report</option>
        </select>
    </div>

    <!-- Report Container -->
    <div id="report-container" style="display: none; margin: 20px 0;">
        <!-- 
            The Magic: Just 3 attributes needed!
            - report-code: Which report to load
            - api-base-url: Where the API is
            - api-key: Authentication
        -->
        <rb-report id="rb-report"></rb-report>
    </div>

    <!-- Integration Example -->
    <div class="card" style="margin-top: 30px; padding: 15px;">
        <h2><?php _e('Integration Code', 'reportburster-integration'); ?></h2>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;"><code>&lt;rb-report 
    report-code="sales-summary"
    api-base-url="<?php echo esc_attr($api_base_url); ?>"
    api-key="YOUR_API_KEY"&gt;
&lt;/rb-report&gt;</code></pre>
        <p class="description">
            <?php _e('That\'s it! The component automatically:', 'reportburster-integration'); ?>
        </p>
        <ol>
            <li><?php _e('Fetches configuration from the server', 'reportburster-integration'); ?></li>
            <li><?php _e('Renders a parameter form (if configured)', 'reportburster-integration'); ?></li>
            <li><?php _e('Fetches data when user submits', 'reportburster-integration'); ?></li>
            <li><?php _e('Displays tables, charts, and pivots based on server config', 'reportburster-integration'); ?></li>
        </ol>
        <p><strong><?php _e('Server is the single source of truth.', 'reportburster-integration'); ?></strong></p>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const reportSelect = document.getElementById('report-select');
    const reportContainer = document.getElementById('report-container');
    const rbReport = document.getElementById('rb-report');
    
    // Configuration from WordPress
    const API_BASE_URL = '<?php echo esc_js($api_base_url); ?>';
    const API_KEY = '<?php echo esc_js($api_key); ?>';
    
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
            requestAnimationFrame(() => { 
                rbReport.reportCode = reportCode; 
            });
        } else {
            reportContainer.style.display = 'none';
        }
    });
});
</script>
