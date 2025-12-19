<svelte:options customElement="rb-chart" accessors={true} />

<script lang="ts">
  import { onMount, afterUpdate, onDestroy, tick, createEventDispatcher } from 'svelte';

  // DEBUG: counters for lifecycle events
  let _afterUpdateCount = 0;
  let _lastAfterUpdateLogTime = 0;

  // ============================================================================
  // Hybrid Mode Props - when reportCode is provided, component self-fetches
  // ============================================================================
  export let reportCode: string = '';
  export let apiBaseUrl: string = '';
  export let apiKey: string = '';

  // ============================================================================
  // Props Mode - traditional props-based usage (e.g., from Angular)
  // ============================================================================
  export let data: any = { labels: [], datasets: [] };
  export let options: any = {};
  export let type: string | undefined = undefined; // if undefined, datasets may specify own types
  export let loading: boolean = false;
  export let plugins: any[] = [];
  export let responsive: boolean = true;
  export let width: string | number | undefined = undefined;
  export let height: string | number | undefined = undefined;

  // ============================================================================
  // Internal state for self-fetch mode
  // ============================================================================
  let selfFetchLoading = false;
  let error: string | null = null;
  
  // Raw DSL source code (exposed for Configuration tab)
  export let configDsl: string = '';
  
  // Full chart configuration from DSL (type, labelField, datasets, options)
  let chartConfig: any = null;

  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let chart: any = null;
  let lastChartType: string | undefined = undefined;
  const dispatch = createEventDispatcher();

  // reuse ResizeObserver patch from RbTabulator
  function transformChartConfigToChartJS(chartConfig: any, reportData: any[]) {
    if (!reportData || reportData.length === 0) return { labels: [], datasets: [] };
    
    const labelField = chartConfig.labelField || Object.keys(reportData[0]).find((k: string) => typeof reportData[0][k] === 'string') || Object.keys(reportData[0])[0];
    
    // Extract labels
    const labels = reportData.map((row: any) => row[labelField] != null ? String(row[labelField]) : '');
    
    // Transform datasets - extract field values into data arrays
    const datasets = (chartConfig.datasets || []).map((ds: any) => {
      const field = ds.field;
      if (!field) return ds; // Skip if no field specified
      
      const dataValues = reportData.map((row: any) => {
        const val = row[field];
        if (val == null) return null;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const num = Number(val);
          return isNaN(num) ? null : num;
        }
        return val;
      });
      
      // Build dataset with transformed data
      const result = { ...ds };
      delete result.field; // Remove field property
      result.data = dataValues;
      if (!result.label) result.label = field;
      
      // Map 'color' shorthand to Chart.js properties
      if (result.color) {
        // Use color as both border and background (Chart.js will handle transparency)
        if (!result.borderColor) result.borderColor = result.color;
        if (!result.backgroundColor) result.backgroundColor = result.color;
        delete result.color; // Remove shorthand property
      }
      
      return result;
    });
    
    return { labels, datasets };
  }

  function patchResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return;

    try {
      const proto = ResizeObserver.prototype as any;
      if (proto.__rbPatched__) return;
      proto.__rbPatched__ = true;

      const origObserve = proto.observe;
      const origUnobserve = proto.unobserve;
      const origDisconnect = proto.disconnect;

      proto.observe = function (target: any) {
        try {
          if (target instanceof Element) {
            return origObserve.call(this, target);
          }
        } catch (err) {
          // swallow
        }
      };

      proto.unobserve = function (target: any) {
        try {
          if (target instanceof Element) {
            return origUnobserve.call(this, target);
          }
        } catch (err) {
          // swallow
        }
      };

      proto.disconnect = function () {
        try {
          return origDisconnect.call(this);
        } catch (err) {
          // swallow
        }
      };
    } catch (err) {
      // No-op
    }
  }

  function buildConfig() {
    const normalizedData = normalizeDataForChart(data);
    // Extract Chart.js options from chartConfig.options (DSL mode) or use props
    // chartConfig has structure: { type, labelField, datasets, options (Chart.js options) }
    let mergedOptions: any = { responsive };
    
    // First apply Chart.js options from chartConfig (DSL mode)
    if (chartConfig?.options) {
      mergedOptions = Object.assign({}, chartConfig.options, mergedOptions);
    }
    // Then apply any prop-based options (Angular mode)
    if (options && !chartConfig) {
      mergedOptions = Object.assign({}, options, mergedOptions);
    }
    
    return {
      type: type || chartConfig?.type || (normalizedData?.datasets?.[0]?.type || 'line'),
      data: normalizedData || { labels: [], datasets: [] },
      options: mergedOptions,
      plugins: plugins || [],
    } as any;
  }

  function normalizeDataForChart(d: any) {
    // If it's already ChartJS config, use as-is
    if (!d) return { labels: [], datasets: [] };
    if (d.labels && d.datasets) return d;
    
    // Handle { chartConfig, reportData } format from DSL
    if (d.chartConfig && d.reportData && Array.isArray(d.reportData)) {
      return transformChartConfigToChartJS(d.chartConfig, d.reportData);
    }
    
    // If payload is a simple array of rows -> convert using heuristics
    if (Array.isArray(d)) {
      const rows = d;
      if (!rows || rows.length === 0) return { labels: [], datasets: [] };
      const cols = Object.keys(rows[0]);
      // try to find label column - prefer string values
      let labelCol = cols.find((c) => typeof rows[0][c] === 'string');
      if (!labelCol) labelCol = cols[0];
      // find numeric columns for series
      const seriesCols = cols.filter((c) => c !== labelCol && (typeof rows[0][c] === 'number' || !isNaN(Number(rows[0][c]))));
      // fallback: use second column as series
      if (seriesCols.length === 0 && cols.length > 1) seriesCols.push(cols[1]);
      const labels = rows.map((r) => (r[labelCol] == null ? '' : String(r[labelCol])));
      const datasets = seriesCols.map((col) => ({ label: col, data: rows.map((r) => { const v = r[col]; return v == null ? null : (typeof v === 'number' ? v : Number(v)); }) }));
      return { labels, datasets };
    }
    // If d is an object with data: rows or dataSpec, try to use its data property
    if (d.data && Array.isArray(d.data)) return normalizeDataForChart(d.data);
    // otherwise, fallback to empty chart data
    return { labels: [], datasets: [] };
  }

  async function createChart() {
    if (!canvas) return;

    try {
      const mod = await import('chart.js/auto');
      const ChartCtor = (mod as any).Chart || (mod as any).default || (mod as any);
      if (!ChartCtor) throw new Error('Chart.js module not found');

      const config = buildConfig();
      chart = new ChartCtor(canvas.getContext('2d'), config);
      lastChartType = config.type;
      dispatch('ready', { chart });

      // forward click events
      canvas.addEventListener('click', (evt: MouseEvent) => {
        try {
          if (!chart) return;
          const points = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false) || [];
          if (points.length) {
            const p = points[0];
            dispatch('chartClick', {
              event: evt,
              datasetIndex: p.datasetIndex,
              index: p.index,
              element: p,
            });
          }
        } catch (err) {
          // ignore
        }
      });
    } catch (err) {
      console.error('rb-chart init error', err);
      dispatch('initError', { message: String(err) });
    }
  }

  function destroyChart() {
    if (chart) {
      try {
        chart.destroy();
      } catch (err) {
        // ignore
      }
      chart = null;
      lastChartType = undefined;
    }
  }

  // allow external callers to update data/options via named exports
  export function updateChartData(newData: any) {
    data = newData;
    if (chart) {
      chart.config.data = data;
      try { chart.update(); } catch (err) { dispatch('chartError', { message: String(err) }); }
    }
  }

  export function updateChartOptions(newOptions: any) {
    options = newOptions;
    if (chart) {
      chart.config.options = Object.assign({}, chart.config.options || {}, newOptions);
      try { chart.update(); } catch (err) { dispatch('chartError', { message: String(err) }); }
    }
  }

  export function getChartInstance() {
    return chart;
  }

  onMount(async () => {
    patchResizeObserver();
    await tick();

    // Read attributes directly from host element (Svelte props may not be populated yet)
    // Navigate from container up through shadow DOM to host element
    const shadowRoot = container?.getRootNode();
    const hostEl = (shadowRoot as ShadowRoot)?.host;
    if (hostEl) {
      if (!reportCode) reportCode = hostEl.getAttribute('report-code') || '';
      if (!apiBaseUrl) apiBaseUrl = hostEl.getAttribute('api-base-url') || '';
      if (!apiKey) apiKey = hostEl.getAttribute('api-key') || '';
    }

    if (!container) {
      dispatch('initError', { message: 'Missing container element' });
      return;
    }

    // ========================================================================
    // Hybrid Mode: if reportCode provided, self-fetch config + data
    // ========================================================================
    if (reportCode && apiBaseUrl) {
      selfFetchLoading = true;
      error = null;
      
      const headers: Record<string, string> = {};
      // TEMP: API key disabled for rollback
      // if (apiKey) headers['X-API-Key'] = apiKey;
      
      try {
        // Fetch config
        const configRes = await fetch(`${apiBaseUrl}/reports/${reportCode}/config`, { headers });
        if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
        const config = await configRes.json();
        
        // Store full chart configuration from DSL
        // chartConfig has structure: { type, labelField, datasets, options (Chart.js options) }
        if (config.chartOptions) {
          chartConfig = config.chartOptions;
          if (chartConfig.type) type = chartConfig.type;
        }
        
        // Store raw DSL for Configuration tab display
        if (config.chartDsl) {
          configDsl = config.chartDsl;
        }
        
        // Fetch data (GET with empty query params for initial load)
        const dataRes = await fetch(`${apiBaseUrl}/reports/${reportCode}/data`, { headers });
        if (!dataRes.ok) throw new Error(`Data fetch failed: ${dataRes.status}`);
        const dataResult = await dataRes.json();
        // Backend returns { reportData: [...] }, extract the array
        const reportData = Array.isArray(dataResult) ? dataResult : (dataResult?.reportData || []);
        
        // Transform data using chartConfig (which contains datasets with field mappings)
        if (chartConfig && reportData) {
          data = transformChartConfigToChartJS(chartConfig, reportData);
        }
        
        // Dispatch events for config and data loaded
        dispatch('configLoaded', { configDsl, config });
        dispatch('dataFetched', { data: reportData });
        
      } catch (err: any) {
        error = err.message || 'Failed to load report';
        console.error('rb-chart self-fetch error:', err);
        dispatch('fetchError', { message: error });
        selfFetchLoading = false;
        return;
      }
      selfFetchLoading = false;
    }

    // apply width/height if provided
    if (width) container.style.width = String(width);
    if (height) container.style.height = String(height);

    await createChart();
  });

  afterUpdate(async () => {
    _afterUpdateCount++;
    const now = Date.now();
    // Log at most once per second
    if (now - _lastAfterUpdateLogTime > 1000) {
      console.log('[DEBUG] rb-chart afterUpdate called', _afterUpdateCount, 'times total');
      _lastAfterUpdateLogTime = now;
    }
    // Warn if called excessively
    if (_afterUpdateCount > 100 && _afterUpdateCount % 100 === 0) {
      console.warn('[DEBUG] WARNING: rb-chart afterUpdate called', _afterUpdateCount, 'times - possible infinite loop!');
    }
    
    // naive update logic: if chart type changed, rebuild chart; otherwise update data/options
    try {
      const newType = type || chartConfig?.type || (data?.datasets?.[0]?.type);
      if (chart && lastChartType !== newType) {
        // rebuild chart
        destroyChart();
        await createChart();
        return;
      }

      if (chart) {
        // update datasets and labels in-place to preserve animation and scales
        const normalizedData = normalizeDataForChart(data);
        chart.config.data = normalizedData || chart.config.data;
        
        // Merge Chart.js options - preserve existing, apply chartConfig (DSL) or options (Angular)
        let mergedOptions: any = Object.assign({}, chart.config.options || {});
        if (chartConfig?.options) {
          // DSL mode: use chartConfig.options
          mergedOptions = Object.assign({}, chartConfig.options, mergedOptions);
        } else if (options) {
          // Angular mode: use options prop
          mergedOptions = Object.assign({}, options, mergedOptions);
        }
        chart.config.options = mergedOptions;
        
        try { chart.update(); } catch (err) { dispatch('chartError', { message: String(err) }); }
      }
    } catch (err) {
      console.error('rb-chart update error', err);
      dispatch('chartError', { message: String(err) });
    }
  });

  onDestroy(() => {
    destroyChart();
  });

  // Public method to fetch data with parameters (for use after initial load)
  export async function fetchData(params: Record<string, any> = {}) {
    if (!reportCode || !apiBaseUrl) {
      console.warn('rb-chart: fetchData requires reportCode and apiBaseUrl');
      return;
    }
    
    selfFetchLoading = true;
    const headers: Record<string, string> = {};
    // TEMP: API key disabled for rollback
    // if (apiKey) headers['X-API-Key'] = apiKey;
    
    try {
      // Re-fetch config to get any DSL changes
      const configRes = await fetch(`${apiBaseUrl}/reports/${reportCode}/config`, { headers });
      if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
      const config = await configRes.json();
      
      // Update chartConfig from fresh config
      if (config.chartOptions) {
        chartConfig = config.chartOptions;
        if (chartConfig.type) type = chartConfig.type;
      }
      
      // Update raw DSL for Configuration tab
      if (config.chartDsl) {
        configDsl = config.chartDsl;
      }
      
      // Build query string from params
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const url = queryString 
        ? `${apiBaseUrl}/reports/${reportCode}/data?${queryString}`
        : `${apiBaseUrl}/reports/${reportCode}/data`;
      
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`Data fetch failed: ${res.status}`);
      const dataResult = await res.json();
      // Backend returns { reportData: [...] }, extract the array
      const reportData = Array.isArray(dataResult) ? dataResult : (dataResult?.reportData || []);
      
      // Transform data using updated chartConfig
      if (chartConfig && reportData) {
        data = transformChartConfigToChartJS(chartConfig, reportData);
      }
      
      // Rebuild chart to apply new config (options like title, scales, etc.)
      destroyChart();
      await createChart();
      
      dispatch('dataFetched', { data });
    } catch (err: any) {
      error = err.message || 'Failed to fetch data';
      dispatch('fetchError', { message: error });
    }
    selfFetchLoading = false;
  }
</script>

<style>
  :host {
    display: block;
    position: relative;
    width: 100%;
  }
  .rb-chart-root { 
    width: 100%; 
    position: relative; 
  }
  /* Let Chart.js control canvas sizing when responsive/maintainAspectRatio are set */
  canvas { 
    display: block; 
  }
  .rb-chart-overlay {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 2; background: rgba(255,255,255,0.6);
  }
  .rb-chart-spinner {
    width: 32px; height: 32px; border: 4px solid #ddd; border-top-color: #007bff; border-radius: 50%; animation: spin 1s linear infinite;
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .rb-loading {
    padding: 1rem;
    text-align: center;
    color: #666;
  }
  .rb-error {
    padding: 1rem;
    text-align: center;
    color: #dc3545;
    background: #fff5f5;
    border: 1px solid #dc3545;
    border-radius: 4px;
  }
</style>

{#if selfFetchLoading}
  <div class="rb-loading">Loading...</div>
{/if}
{#if error}
  <div class="rb-error">{error}</div>
{/if}
<div class="rb-chart-root" bind:this={container} style:display={selfFetchLoading || error ? 'none' : 'block'}>
  {#if loading}
    <div class="rb-chart-overlay"><div class="rb-chart-spinner"></div></div>
  {/if}
  <canvas bind:this={canvas}></canvas>
</div>
