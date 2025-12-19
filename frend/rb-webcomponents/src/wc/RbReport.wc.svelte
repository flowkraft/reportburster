<svelte:options customElement="rb-report" accessors={true} />

<script lang="ts">
  import { onMount, tick } from 'svelte';

  // ============================================================================
  // Minimal Interface - Only 3 required props!
  // ============================================================================
  
  /** Report folder name (e.g., "sales-summary") */
  export let reportCode: string = '';
  
  /** Base URL for API calls (e.g., "http://localhost:9090/api/jobman/reporting") */
  export let apiBaseUrl: string = '';
  
  /** API key for authentication (passed from host app) */
  export let apiKey: string = '';
  
  /** Optional: Entity code for single-entity HTML document rendering */
  export let entityCode: string = '';
  
  /** Optional: Show print/download button in entity mode */
  export let showPrintButton: boolean = false;
  
  /** Optional: Custom label for the print button (default: 'Print') */
  export let printButtonLabel: string = 'Print';
  
  // ============================================================================
  // Internal State
  // ============================================================================
  
  let config: any = null;
  let reportData: any[] = [];
  let renderedHtml: string = '';
  let loading = false;
  let configLoaded = false;
  let dataLoaded = false;
  let error: string | null = null;
  
  // Track previous entityCode to detect changes
  let prevEntityCode: string = '';
  
  // Parameter values (collected from form)
  let parameterValues: Record<string, any> = {};
  
  // Component refs
  let container: HTMLDivElement;
  let tabulatorEl: any;
  let chartEl: any;
  let pivotEl: any;
  let parametersEl: any;
  let reportIframe: HTMLIFrameElement;
  
  // ============================================================================
  // Lifecycle
  // ============================================================================
  
  onMount(async () => {
    console.log('[RbReport] onMount - reportCode:', reportCode, 'apiBaseUrl:', apiBaseUrl, 'entityCode:', entityCode);
    
    // Read attributes from host element if props are empty (same pattern as other components)
    await tick();
    const hostElement = document.querySelector('rb-report');
    console.log('[RbReport] onMount - hostElement:', hostElement);
    
    if (!reportCode && hostElement) {
      reportCode = hostElement.getAttribute('report-code') || '';
      console.log('[RbReport] onMount - read report-code from attribute:', reportCode);
    }
    if (!apiBaseUrl && hostElement) {
      apiBaseUrl = hostElement.getAttribute('api-base-url') || '';
      console.log('[RbReport] onMount - read api-base-url from attribute:', apiBaseUrl);
    }
    if (!apiKey && hostElement) {
      apiKey = hostElement.getAttribute('api-key') || '';
      console.log('[RbReport] onMount - read api-key from attribute:', apiKey);
    }
    if (!entityCode && hostElement) {
      entityCode = hostElement.getAttribute('entity-code') || '';
      console.log('[RbReport] onMount - read entity-code from attribute:', entityCode);
    }
    // Read show-print-button attribute
    if (hostElement && hostElement.hasAttribute('show-print-button')) {
      const printAttr = hostElement.getAttribute('show-print-button');
      showPrintButton = printAttr === '' || printAttr === 'true';
      console.log('[RbReport] onMount - read show-print-button from attribute:', showPrintButton);
    }
    // Read print-button-label attribute
    if (hostElement && hostElement.hasAttribute('print-button-label')) {
      printButtonLabel = hostElement.getAttribute('print-button-label') || 'Print';
      console.log('[RbReport] onMount - read print-button-label from attribute:', printButtonLabel);
    }
    
    console.log('[RbReport] onMount - after attribute read: reportCode:', reportCode, 'apiBaseUrl:', apiBaseUrl, 'entityCode:', entityCode);
    
    if (reportCode && apiBaseUrl) {
      // In entity mode, skip config loading and directly fetch data with entityCode
      if (entityCode) {
        console.log('[RbReport] onMount - entity mode, calling fetchData()');
        await fetchData();
      } else {
        console.log('[RbReport] onMount - normal mode, calling loadConfig()');
        await loadConfig();
      }
    } else {
      console.warn('[RbReport] onMount - missing reportCode or apiBaseUrl, not fetching');
    }
  });
  
  // Watch for prop changes
  $: if (reportCode && apiBaseUrl && !configLoaded && !entityCode) {
    console.log('[RbReport] prop watcher triggered - loadConfig()');
    loadConfig();
  }
  
  // Watch for entityCode changes - fetch data directly in entity mode
  // Use prevEntityCode to detect actual changes and re-fetch
  $: if (reportCode && apiBaseUrl && entityCode && entityCode !== prevEntityCode) {
    console.log('[RbReport] entityCode watcher triggered - entityCode:', entityCode, 'prevEntityCode:', prevEntityCode);
    prevEntityCode = entityCode;
    dataLoaded = false; // Reset to allow fresh fetch
    fetchData();
  }
  
  // ============================================================================
  // API Calls
  // ============================================================================
  
  async function loadConfig() {
    if (!reportCode || !apiBaseUrl) return;
    
    loading = true;
    error = null;
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      // TEMP: API key disabled for rollback
      // if (apiKey) {
      //   headers['X-API-Key'] = apiKey;
      // }
      
      const response = await fetch(`${apiBaseUrl}/reports/${reportCode}/config`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      
      config = await response.json();
      configLoaded = true;
      
      // Initialize parameter values with defaults
      if (config.parameters) {
        config.parameters.forEach((p: any) => {
          parameterValues[p.id] = p.defaultValue ?? getDefaultForType(p.type);
        });
      }
      
      // If no parameters, fetch data immediately
      if (!config.hasParameters) {
        await fetchData();
      }
      
    } catch (e: any) {
      error = e.message || 'Failed to load report configuration';
      console.error('rb-report: loadConfig error', e);
    } finally {
      loading = false;
    }
  }
  
  async function fetchData() {
    console.log('[RbReport] fetchData called - reportCode:', reportCode, 'apiBaseUrl:', apiBaseUrl, 'entityCode:', entityCode);
    
    if (!reportCode || !apiBaseUrl) {
      console.warn('[RbReport] fetchData - missing reportCode or apiBaseUrl, returning');
      return;
    }
    
    loading = true;
    error = null;
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      // TEMP: API key disabled for rollback
      // if (apiKey) {
      //   headers['X-API-Key'] = apiKey;
      // }
      
      // Build query string from parameters
      const params = new URLSearchParams();
      
      // Include entityCode if present (for single-entity HTML rendering)
      if (entityCode) {
        console.log('[RbReport] fetchData - adding entityCode to params:', entityCode);
        params.set('entityCode', entityCode);
      }
      
      Object.entries(parameterValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });
      
      const url = `${apiBaseUrl}/reports/${reportCode}/data?${params.toString()}`;
      console.log('[RbReport] fetchData - fetching from URL:', url);
      
      const response = await fetch(url, { headers });
      console.log('[RbReport] fetchData - response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[RbReport] fetchData - result:', result);
      console.log('[RbReport] fetchData - reportData length:', result.reportData?.length);
      console.log('[RbReport] fetchData - renderedHtml length:', result.renderedHtml?.length);
      
      reportData = result.reportData || [];
      renderedHtml = result.renderedHtml || '';
      dataLoaded = true;
      
      console.log('[RbReport] fetchData - dataLoaded set to true, renderedHtml:', renderedHtml ? renderedHtml.substring(0, 200) + '...' : 'empty');
      
      // After data loaded, update child components
      await tick();
      updateVisualizations();
      
    } catch (e: any) {
      error = e.message || 'Failed to fetch report data';
      console.error('rb-report: fetchData error', e);
    } finally {
      loading = false;
    }
  }
  
  // ============================================================================
  // Helpers
  // ============================================================================
  
  function getDefaultForType(type: string): any {
    const t = (type || '').toLowerCase();
    if (t === 'boolean') return false;
    if (t === 'integer' || t === 'decimal') return null;
    return '';
  }
  
  /**
   * Print the rendered HTML report.
   * Opens a new window with the HTML content and triggers the print dialog.
   * Users can print to paper or save as PDF using their browser's print dialog.
   */
  function printReport() {
    if (!renderedHtml) {
      console.warn('[RbReport] printReport - no renderedHtml available');
      return;
    }
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('[RbReport] printReport - failed to open print window (popup blocked?)');
      alert('Please allow popups for this site to enable printing.');
      return;
    }
    
    // Write the HTML content to the new window
    printWindow.document.open();
    printWindow.document.write(renderedHtml);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Note: We don't close the window automatically so users can 
      // review the document or try printing again if needed
    };
    
    // Fallback: trigger print after a short delay if onload doesn't fire
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }
  
  function handleParameterChange(e: CustomEvent) {
    if (e.detail?.values) {
      parameterValues = { ...e.detail.values };
    }
  }
  
  function handleParameterSubmit(e: CustomEvent) {
    if (e.detail?.values) {
      parameterValues = { ...e.detail.values };
    }
    fetchData();
  }
  
  function updateVisualizations() {
    // Update Tabulator
    if (tabulatorEl && config?.hasTabulator) {
      tabulatorEl.data = reportData;
      if (config.tabulatorOptions?.columns) {
        tabulatorEl.columns = config.tabulatorOptions.columns;
      }
      if (config.tabulatorOptions?.layoutOptions) {
        tabulatorEl.options = config.tabulatorOptions.layoutOptions;
      }
    }
    
    // Update Chart
    if (chartEl && config?.hasChart) {
      const chartConfig = config.chartOptions || {};
      
      // Transform data for Chart.js format
      const chartData = transformToChartData(reportData, chartConfig);
      chartEl.data = chartData;
      
      if (chartConfig.type) {
        chartEl.type = chartConfig.type;
      }
      if (chartConfig.options) {
        chartEl.options = chartConfig.options;
      }
    }
    
    // Update Pivot Table
    if (pivotEl && config?.hasPivotTable) {
      pivotEl.data = reportData;
      const pivotOpts = config.pivotTableOptions || {};
      if (pivotOpts.rows) pivotEl.rows = pivotOpts.rows;
      if (pivotOpts.cols) pivotEl.cols = pivotOpts.cols;
      if (pivotOpts.vals) pivotEl.vals = pivotOpts.vals;
      if (pivotOpts.aggregatorName) pivotEl.aggregatorName = pivotOpts.aggregatorName;
      if (pivotOpts.rendererName) pivotEl.rendererName = pivotOpts.rendererName;
    }
  }
  
  function transformToChartData(data: any[], chartConfig: any) {
    if (!data || data.length === 0) return { labels: [], datasets: [] };
    
    const labelField = chartConfig.labelField || Object.keys(data[0])[0];
    const labels = data.map((row: any) => row[labelField] != null ? String(row[labelField]) : '');
    
    const datasets = (chartConfig.datasets || []).map((ds: any) => {
      const field = ds.field;
      if (!field) return ds;
      
      const dataValues = data.map((row: any) => {
        const val = row[field];
        if (val == null) return null;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const num = Number(val);
          return isNaN(num) ? null : num;
        }
        return val;
      });
      
      const result = { ...ds };
      delete result.field;
      result.data = dataValues;
      if (!result.label) result.label = field;
      
      if (result.color) {
        if (!result.borderColor) result.borderColor = result.color;
        if (!result.backgroundColor) result.backgroundColor = result.color;
        delete result.color;
      }
      
      return result;
    });
    
    return { labels, datasets };
  }
</script>

<div bind:this={container} class="rb-report">
  {#if loading}
    <div class="rb-report-loading">
      <div class="rb-report-spinner"></div>
      <span>Loading...</span>
    </div>
  {/if}
  
  {#if error}
    <div class="rb-report-error">
      <strong>Error:</strong> {error}
    </div>
  {/if}
  
  {#if configLoaded && !error}
    <!-- Parameters Section -->
    {#if config.hasParameters}
      <div class="rb-report-section rb-report-parameters">
        <rb-parameters
          bind:this={parametersEl}
          parameters={config.parameters}
          on:change={handleParameterChange}
          on:submit={handleParameterSubmit}
        ></rb-parameters>
        <button class="rb-report-run-btn" on:click={() => fetchData()} disabled={loading}>
          {loading ? 'Loading...' : 'Run Report'}
        </button>
      </div>
    {/if}
    
    <!-- Visualizations Section (only show after data loaded) -->
    {#if dataLoaded}
      <div class="rb-report-visualizations">
        {#if config.hasTabulator}
          <div class="rb-report-section rb-report-table">
            <rb-tabulator bind:this={tabulatorEl}></rb-tabulator>
          </div>
        {/if}
        
        {#if config.hasChart}
          <div class="rb-report-section rb-report-chart">
            <rb-chart bind:this={chartEl}></rb-chart>
          </div>
        {/if}
        
        {#if config.hasPivotTable}
          <div class="rb-report-section rb-report-pivot">
            <rb-pivot-table bind:this={pivotEl}></rb-pivot-table>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
  
  <!-- Entity Mode: Display rendered HTML in iframe -->
  {#if entityCode && dataLoaded && renderedHtml}
    <div class="rb-report-entity-html">
      {#if showPrintButton}
        <div class="rb-report-print-toolbar">
          <button class="rb-report-print-btn" on:click={printReport} title="Print or Save as PDF">
            <svg class="rb-report-print-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9V2h12v7"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            {printButtonLabel}
          </button>
        </div>
      {/if}
      <iframe 
        bind:this={reportIframe}
        class="rb-report-iframe"
        srcdoc={renderedHtml}
        title="Report for {entityCode}"
        sandbox="allow-same-origin allow-scripts allow-modals"
      ></iframe>
    </div>
  {/if}
  
  {#if entityCode && dataLoaded && !renderedHtml && !error}
    <div class="rb-report-no-content">
      No HTML content available for entity: {entityCode}
    </div>
  {/if}
</div>

<style>
  .rb-report {
    width: 100%;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  .rb-report-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    color: #666;
  }
  
  .rb-report-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e0e0e0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .rb-report-error {
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 4px;
    color: #b91c1c;
    margin-bottom: 16px;
  }
  
  .rb-report-section {
    margin-bottom: 24px;
  }
  
  .rb-report-parameters {
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  
  .rb-report-run-btn {
    margin-top: 12px;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .rb-report-run-btn:hover:not(:disabled) {
    background: #2563eb;
  }
  
  .rb-report-run-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
  
  .rb-report-visualizations {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .rb-report-entity-html {
    width: 100%;
    min-height: 400px;
  }
  
  .rb-report-iframe {
    width: 100%;
    min-height: 600px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    background: white;
  }
  
  .rb-report-no-content {
    padding: 16px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 4px;
    color: #92400e;
  }
  
  .rb-report-print-toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 8px 0;
    margin-bottom: 8px;
  }
  
  .rb-report-print-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .rb-report-print-btn:hover {
    background: #2563eb;
  }
  
  .rb-report-print-btn:active {
    background: #1d4ed8;
  }
  
  .rb-report-print-icon {
    width: 18px;
    height: 18px;
  }
</style>
