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
  
  // ============================================================================
  // Internal State
  // ============================================================================
  
  let config: any = null;
  let reportData: any[] = [];
  let loading = false;
  let configLoaded = false;
  let dataLoaded = false;
  let error: string | null = null;
  
  // Parameter values (collected from form)
  let parameterValues: Record<string, any> = {};
  
  // Component refs
  let container: HTMLDivElement;
  let tabulatorEl: any;
  let chartEl: any;
  let pivotEl: any;
  let parametersEl: any;
  
  // ============================================================================
  // Lifecycle
  // ============================================================================
  
  onMount(async () => {
    if (reportCode && apiBaseUrl) {
      await loadConfig();
    }
  });
  
  // Watch for prop changes
  $: if (reportCode && apiBaseUrl && !configLoaded) {
    loadConfig();
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
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      
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
    if (!reportCode || !apiBaseUrl) return;
    
    loading = true;
    error = null;
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      
      // Build query string from parameters
      const params = new URLSearchParams();
      Object.entries(parameterValues).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });
      
      const url = `${apiBaseUrl}/reports/${reportCode}/data?${params.toString()}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const result = await response.json();
      reportData = result.reportData || [];
      dataLoaded = true;
      
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
</style>
