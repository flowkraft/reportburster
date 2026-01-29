<svelte:options customElement="rb-pivot-table" accessors={true} />

<script lang="ts">
  import { onMount, afterUpdate, onDestroy, tick, createEventDispatcher } from 'svelte';
  import { PivotData, aggregators as defaultAggregators, getSort, sortAs, naturalSort } from './services/pivot-data';
  import { 
    renderPivotTableHTML, 
    renderPivotTableTSV,
    getChartConfigForRenderer,
    renderers,
    rendererNames,
    tableRendererNames,
    chartRendererNames,
    type RendererInfo
  } from './services/pivot-renderers';
  import type {
    PivotTableProps,
    PivotTableState,
    ValueFilter,
    SortOrder,
    AggregatorFactory,
    TableClickCallback,
    PivotEngine
  } from './services/pivot-types';
  import { pivotApi, buildServerPivotRequest } from './services/pivot-api';
  import type { ServerPivotResponse } from './services/pivot-api';

  // ============================================================================
  // Hybrid Mode Props - when reportCode is provided, component self-fetches
  // ============================================================================
  export let reportCode: string = '';
  export let apiBaseUrl: string = '';
  export let apiKey: string = '';

  // ============================================================================
  // Props - matching react-pivottable API
  // ============================================================================
  
  export let data: Record<string, any>[] = [];
  export let rows: string[] = [];
  export let cols: string[] = [];
  export let vals: string[] = [];
  export let aggregatorName: string = 'Count';
  export let rendererName: string = 'Table';
  export let valueFilter: ValueFilter = {};
  export let sorters: any = {};
  export let derivedAttributes: Record<string, (record: Record<string, any>) => any> = {};
  export let rowOrder: SortOrder = 'key_a_to_z';
  export let colOrder: SortOrder = 'key_a_to_z';
  export let hiddenAttributes: string[] = [];
  export let hiddenFromAggregators: string[] = [];
  export let hiddenFromDragDrop: string[] = [];
  export let unusedOrientationCutoff: number = 85;
  export let menuLimit: number = 500;
  // New props for extensibility
  export let aggregators: Record<string, AggregatorFactory> = {};
  export let tableClickCallback: TableClickCallback | null = null;

  // Server-side processing props
  export let engine: PivotEngine = 'browser';
  export let connectionCode: string = '';
  export let tableName: string = '';

  // ============================================================================
  // Internal state for self-fetch mode
  // ============================================================================
  let loading = false;
  let error: string | null = null;

  // Raw DSL source code (exposed for Configuration tab)
  export let configDsl: string = '';

  // Server-side pivot response metadata
  let serverMetadata: ServerPivotResponse['metadata'] | null = null;

  // ============================================================================
  // Internal State
  // ============================================================================
  
  let container: HTMLDivElement;
  let outputContainer: HTMLDivElement;
  let chartCanvas: HTMLCanvasElement;
  let chartInstance: any = null;
  
  // Materialized data
  let attrValues: Record<string, Record<string, number>> = {};
  let materializedInput: Record<string, any>[] = [];
  
  // UI State
  let unusedOrder: string[] = [];
  let zIndices: Record<string, number> = {};
  let maxZIndex = 1000;
  let openDropdown: string | false = false;
  let openFilterBox: string | null = null;
  let filterText: string = '';
  
  // Drag state
  let draggedAttr: string | null = null;

  const dispatch = createEventDispatcher();

  // ============================================================================
  // Sort Icons
  // ============================================================================
  
  const sortIcons: Record<SortOrder, { rowSymbol: string; colSymbol: string; next: SortOrder }> = {
    'key_a_to_z': { rowSymbol: '↕', colSymbol: '↔', next: 'value_a_to_z' },
    'value_a_to_z': { rowSymbol: '↓', colSymbol: '→', next: 'value_z_to_a' },
    'value_z_to_a': { rowSymbol: '↑', colSymbol: '←', next: 'key_a_to_z' },
  };

  // ============================================================================
  // Computed Values
  // ============================================================================
  
  // Merge default aggregators with custom ones (custom overrides default)
  $: mergedAggregators = { ...defaultAggregators, ...aggregators };
  
  $: allAttrs = Object.keys(attrValues);
  
  $: unusedAttrs = allAttrs
    .filter(e => !rows.includes(e) && !cols.includes(e) && !hiddenAttributes.includes(e) && !hiddenFromDragDrop.includes(e))
    .sort(sortAs(unusedOrder));
  
  $: visibleRows = rows.filter(e => !hiddenAttributes.includes(e) && !hiddenFromDragDrop.includes(e));
  $: visibleCols = cols.filter(e => !hiddenAttributes.includes(e) && !hiddenFromDragDrop.includes(e));
  
  $: unusedLength = unusedAttrs.reduce((r, e) => r + e.length, 0);
  $: horizUnused = unusedLength < unusedOrientationCutoff;
  
  $: aggregatorOptions = Object.keys(mergedAggregators);
  
  $: numValsAllowed = mergedAggregators[aggregatorName]?.([])?.()?.numInputs || 0;
  
  $: valOptions = allAttrs.filter(e => !hiddenAttributes.includes(e) && !hiddenFromAggregators.includes(e));
  
  $: rendererInfo = renderers[rendererName] || renderers['Table'];
  $: isTableRenderer = rendererInfo.type === 'table';
  $: isChartRenderer = rendererInfo.type === 'chart';

  // ============================================================================
  // PivotData Computation
  // ============================================================================

  $: pivotData = new PivotData({
    data: materializedInput,
    aggregators: mergedAggregators,
    aggregatorName,
    cols,
    rows,
    vals,
    valueFilter,
    sorters,
    derivedAttributes,
    rowOrder,
    colOrder,
  });

  // ============================================================================
  // Server-side Processing (DuckDB Engine)
  // ============================================================================

  // Reactive statement to trigger server-side pivot when engine='duckdb'
  $: if (engine === 'duckdb' && connectionCode && tableName) {
    executePivotOnServer();
  }

  async function executePivotOnServer() {
    if (!connectionCode || !tableName) {
      error = 'connectionCode and tableName are required for server-side processing';
      return;
    }

    loading = true;
    error = null;
    serverMetadata = null;

    try {
      const request = buildServerPivotRequest(connectionCode, tableName, {
        rows,
        cols,
        vals,
        aggregatorName,
        valueFilter,
        rowOrder,
        colOrder,
      });

      console.log('[rb-pivot-table] Executing server-side pivot:', request);
      const response = await pivotApi.executePivot(request, 'pivot-table-main');

      console.log('[rb-pivot-table] Server response received:', {
        rowCount: response.metadata.rowCount,
        executionTimeMs: response.metadata.executionTimeMs,
        aggregator: response.metadata.aggregatorUsed,
      });

      // Update data with server results
      data = response.data;
      serverMetadata = response.metadata;

      dispatch('pivotExecuted', { metadata: serverMetadata });

    } catch (err: any) {
      error = err.message || 'Failed to execute server-side pivot';
      console.error('[rb-pivot-table] Server-side pivot error:', err);
      dispatch('pivotError', { message: error });
    } finally {
      loading = false;
    }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================
  
  onMount(async () => {
    await tick();
    injectStyles();
    
    // Read attributes directly from host element (Svelte props may not be populated yet)
    // Navigate from container up through shadow DOM to host element
    const shadowRoot = container?.getRootNode();
    const hostEl = (shadowRoot as ShadowRoot)?.host;
    if (hostEl) {
      if (!reportCode) reportCode = hostEl.getAttribute('report-code') || '';
      if (!apiBaseUrl) apiBaseUrl = hostEl.getAttribute('api-base-url') || '';
      if (!apiKey) apiKey = hostEl.getAttribute('api-key') || '';
    }
    
    // ========================================================================
    // Hybrid Mode: if reportCode provided, self-fetch config + data
    // ========================================================================
    if (reportCode && apiBaseUrl) {
      loading = true;
      error = null;
      
      const headers: Record<string, string> = {};
      // TEMP: API key disabled for rollback
      // if (apiKey) headers['X-API-Key'] = apiKey;
      
      try {
        // Fetch config
        console.log('[rb-pivot-table] Fetching config from:', `${apiBaseUrl}/reports/${reportCode}/config`);
        const configRes = await fetch(`${apiBaseUrl}/reports/${reportCode}/config`, { headers });
        if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
        const config = await configRes.json();
        console.log('[rb-pivot-table] Config received:', { 
          hasPivotTable: config.hasPivotTable, 
          pivotTableDsl: config.pivotTableDsl ? `${config.pivotTableDsl.length} chars` : 'MISSING',
          pivotTableOptions: config.pivotTableOptions 
        });
        
        // Apply pivot table options from config
        if (config.pivotTableOptions) {
          const opts = config.pivotTableOptions;
          if (opts.rows) rows = opts.rows;
          if (opts.cols) cols = opts.cols;
          if (opts.vals) vals = opts.vals;
          if (opts.aggregatorName) aggregatorName = opts.aggregatorName;
          if (opts.rendererName) rendererName = opts.rendererName;
          if (opts.valueFilter) valueFilter = opts.valueFilter;
          if (opts.rowOrder) rowOrder = opts.rowOrder;
          if (opts.colOrder) colOrder = opts.colOrder;
        }
        
        // Store raw DSL for Configuration tab display
        if (config.pivotTableDsl) {
          configDsl = config.pivotTableDsl;
          console.log('[rb-pivot-table] configDsl set, length:', configDsl.length);
        } else {
          console.warn('[rb-pivot-table] No pivotTableDsl in config response!');
        }
        
        // Fetch data (GET with empty query params for initial load)
        const dataRes = await fetch(`${apiBaseUrl}/reports/${reportCode}/data`, { headers });
        if (!dataRes.ok) throw new Error(`Data fetch failed: ${dataRes.status}`);
        const dataResult = await dataRes.json();
        // Backend returns { reportData: [...] }, extract the array
        data = Array.isArray(dataResult) ? dataResult : (dataResult?.reportData || []);
        
        // Dispatch event so host page knows config/data is ready
        dispatch('configLoaded', { configDsl, config });
        dispatch('dataFetched', { data });
        
      } catch (err: any) {
        error = err.message || 'Failed to load report';
        console.error('rb-pivot-table self-fetch error:', err);
        dispatch('fetchError', { message: error });
        loading = false;
        return;
      }
      loading = false;
    }
    
    materializeInput(data);
  });

  afterUpdate(() => {
    renderOutput();
  });

  onDestroy(() => {
    destroyChart();
  });

  // ============================================================================
  // Data Materialization
  // ============================================================================
  
  function materializeInput(nextData: any) {
    const newAttrValues: Record<string, Record<string, number>> = {};
    const newMaterializedInput: Record<string, any>[] = [];
    let recordsProcessed = 0;

    PivotData.forEachRecord(nextData, derivedAttributes, (record) => {
      newMaterializedInput.push(record);
      
      for (const attr of Object.keys(record)) {
        if (!(attr in newAttrValues)) {
          newAttrValues[attr] = {};
          if (recordsProcessed > 0) {
            newAttrValues[attr]['null'] = recordsProcessed;
          }
        }
      }
      
      for (const attr in newAttrValues) {
        const value = attr in record ? String(record[attr]) : 'null';
        if (!(value in newAttrValues[attr])) {
          newAttrValues[attr][value] = 0;
        }
        newAttrValues[attr][value]++;
      }
      
      recordsProcessed++;
    });

    attrValues = newAttrValues;
    materializedInput = newMaterializedInput;
  }

  // Watch for data changes
  $: if (data) {
    materializeInput(data);
  }

  // ============================================================================
  // Rendering
  // ============================================================================
  
  function renderOutput() {
    if (!outputContainer) return;
    
    try {
      if (isTableRenderer) {
        destroyChart();
        const html = renderPivotTableHTML(pivotData, {
          heatmapMode: rendererInfo.heatmapMode,
          clickable: !!tableClickCallback,
        });
        outputContainer.innerHTML = html;
        
        // Wire up click handling if callback provided
        if (tableClickCallback) {
          setupTableClickHandler();
        }
      } else if (isChartRenderer) {
        renderChart();
      }
    } catch (err) {
      console.error('rb-pivot-table render error:', err);
      outputContainer.innerHTML = `<div class="pvtError">Error rendering: ${err}</div>`;
    }
  }
  
  function setupTableClickHandler() {
    if (!outputContainer || !tableClickCallback) return;
    
    const clickableCells = outputContainer.querySelectorAll('.pvtClickable');
    clickableCells.forEach((cell) => {
      cell.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const row = target.dataset.row || '';
        const col = target.dataset.col || '';
        const value = target.dataset.value || '';
        tableClickCallback!({ row, col, value }, e as MouseEvent);
      });
    });
  }

  async function renderChart() {
    if (!outputContainer) return;
    
    // Ensure canvas exists
    if (!chartCanvas) {
      outputContainer.innerHTML = '<canvas></canvas>';
      chartCanvas = outputContainer.querySelector('canvas')!;
    }

    const config = getChartConfigForRenderer(rendererName, pivotData);
    
    try {
      const mod = await import('chart.js/auto');
      const ChartCtor = (mod as any).Chart || (mod as any).default || mod;
      
      if (chartInstance) {
        // Update existing chart
        chartInstance.config.type = config.type;
        chartInstance.config.data = config.data;
        chartInstance.config.options = config.options;
        chartInstance.update();
      } else {
        // Create new chart
        chartInstance = new ChartCtor(chartCanvas.getContext('2d'), config);
      }
    } catch (err) {
      console.error('Chart.js error:', err);
      outputContainer.innerHTML = `<div class="pvtError">Chart error: ${err}</div>`;
    }
  }

  function destroyChart() {
    if (chartInstance) {
      try { chartInstance.destroy(); } catch (e) {}
      chartInstance = null;
      chartCanvas = null as any;
    }
  }

  // ============================================================================
  // State Update & onChange
  // ============================================================================
  
  function emitChange() {
    const state: PivotTableState = {
      rows,
      cols,
      vals,
      aggregatorName,
      rendererName,
      valueFilter,
      rowOrder,
      colOrder,
    };
    dispatch('change', state);
  }

  function setRenderer(name: string) {
    rendererName = name;
    openDropdown = false;
    emitChange();
  }

  function setAggregator(name: string) {
    aggregatorName = name;
    openDropdown = false;
    emitChange();
  }

  function setVal(index: number, value: string) {
    vals = [...vals.slice(0, index), value, ...vals.slice(index + 1)];
    openDropdown = false;
    emitChange();
  }

  function toggleRowOrder() {
    rowOrder = sortIcons[rowOrder].next;
    emitChange();
  }

  function toggleColOrder() {
    colOrder = sortIcons[colOrder].next;
    emitChange();
  }

  // ============================================================================
  // Filter Box
  // ============================================================================
  
  function toggleFilterBox(attr: string) {
    if (openFilterBox === attr) {
      openFilterBox = null;
    } else {
      openFilterBox = attr;
      filterText = '';
      moveToTop(attr);
    }
  }

  function moveToTop(attr: string) {
    maxZIndex++;
    zIndices = { ...zIndices, [attr]: maxZIndex };
  }

  function matchesFilter(x: string): boolean {
    return x.toLowerCase().trim().includes(filterText.toLowerCase().trim());
  }

  function toggleValue(attr: string, value: string) {
    const newFilter = { ...valueFilter };
    if (!newFilter[attr]) newFilter[attr] = {};
    
    if (value in newFilter[attr]) {
      delete newFilter[attr][value];
      if (Object.keys(newFilter[attr]).length === 0) {
        delete newFilter[attr];
      }
    } else {
      newFilter[attr][value] = true;
    }
    
    valueFilter = newFilter;
    emitChange();
  }

  function selectOnly(attr: string, value: string) {
    const allValues = Object.keys(attrValues[attr] || {});
    const newFilter = { ...valueFilter };
    newFilter[attr] = {};
    
    for (const v of allValues) {
      if (v !== value) {
        newFilter[attr][v] = true;
      }
    }
    
    valueFilter = newFilter;
    emitChange();
  }

  function selectAllFiltered(attr: string) {
    const allValues = Object.keys(attrValues[attr] || {}).filter(matchesFilter);
    const newFilter = { ...valueFilter };
    delete newFilter[attr];
    valueFilter = newFilter;
    emitChange();
  }

  function deselectAllFiltered(attr: string) {
    const allValues = Object.keys(attrValues[attr] || {}).filter(matchesFilter);
    const newFilter = { ...valueFilter };
    if (!newFilter[attr]) newFilter[attr] = {};
    
    for (const v of allValues) {
      newFilter[attr][v] = true;
    }
    
    valueFilter = newFilter;
    emitChange();
  }

  function isValueFiltered(attr: string, value: string): boolean {
    return !!valueFilter[attr]?.[value];
  }

  function hasActiveFilter(attr: string): boolean {
    return Object.keys(valueFilter[attr] || {}).length > 0;
  }

  // ============================================================================
  // Drag and Drop
  // ============================================================================
  
  function onDragStart(e: DragEvent, attr: string) {
    draggedAttr = attr;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', attr);
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  function onDropRows(e: DragEvent) {
    e.preventDefault();
    if (!draggedAttr) return;
    
    // Remove from cols if present
    cols = cols.filter(c => c !== draggedAttr);
    
    // Add to rows if not already there
    if (!rows.includes(draggedAttr)) {
      rows = [...rows, draggedAttr];
    }
    
    draggedAttr = null;
    emitChange();
  }

  function onDropCols(e: DragEvent) {
    e.preventDefault();
    if (!draggedAttr) return;
    
    // Remove from rows if present
    rows = rows.filter(r => r !== draggedAttr);
    
    // Add to cols if not already there
    if (!cols.includes(draggedAttr)) {
      cols = [...cols, draggedAttr];
    }
    
    draggedAttr = null;
    emitChange();
  }

  function onDropUnused(e: DragEvent) {
    e.preventDefault();
    if (!draggedAttr) return;
    
    // Remove from both
    rows = rows.filter(r => r !== draggedAttr);
    cols = cols.filter(c => c !== draggedAttr);
    
    draggedAttr = null;
    emitChange();
  }

  function removeFromRows(attr: string) {
    rows = rows.filter(r => r !== attr);
    emitChange();
  }

  function removeFromCols(attr: string) {
    cols = cols.filter(c => c !== attr);
    emitChange();
  }

  // ============================================================================
  // Styles Injection (Shadow DOM)
  // ============================================================================
  
  function injectStyles() {
    const root = container?.getRootNode();
    if (root instanceof ShadowRoot) {
      const style = document.createElement('style');
      style.textContent = PIVOT_CSS;
      root.appendChild(style);
    }
  }

  // ============================================================================
  // Export Functions
  // ============================================================================
  
  export function exportTSV(): string {
    return renderPivotTableTSV(pivotData);
  }

  export function getPivotData(): PivotData {
    return pivotData;
  }

  export function getState(): PivotTableState {
    return { rows, cols, vals, aggregatorName, rendererName, valueFilter, rowOrder, colOrder };
  }

  // Public method to fetch data with parameters (for use after initial load)
  export async function fetchData(params: Record<string, any> = {}) {
    if (!reportCode || !apiBaseUrl) {
      console.warn('rb-pivot-table: fetchData requires reportCode and apiBaseUrl');
      return;
    }
    
    loading = true;
    const headers: Record<string, string> = {};
    // TEMP: API key disabled for rollback
    // if (apiKey) headers['X-API-Key'] = apiKey;
    
    try {
      // Re-fetch config to get any DSL changes
      const configRes = await fetch(`${apiBaseUrl}/reports/${reportCode}/config`, { headers });
      if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
      const config = await configRes.json();
      
      // Update pivot table options from fresh config
      if (config.pivotTableOptions) {
        const opts = config.pivotTableOptions;
        if (opts.rows) rows = opts.rows;
        if (opts.cols) cols = opts.cols;
        if (opts.vals) vals = opts.vals;
        if (opts.aggregatorName) aggregatorName = opts.aggregatorName;
        if (opts.rendererName) rendererName = opts.rendererName;
        if (opts.valueFilter) valueFilter = opts.valueFilter;
        if (opts.rowOrder) rowOrder = opts.rowOrder;
        if (opts.colOrder) colOrder = opts.colOrder;
      }
      
      // Update raw DSL for Configuration tab
      if (config.pivotTableDsl) {
        configDsl = config.pivotTableDsl;
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
      data = Array.isArray(dataResult) ? dataResult : (dataResult?.reportData || []);
      materializeInput(data);
      dispatch('dataFetched', { data });
    } catch (err: any) {
      error = err.message || 'Failed to fetch data';
      dispatch('fetchError', { message: error });
    }
    loading = false;
  }
</script>

<!-- ============================================================================ -->
<!-- Template -->
<!-- ============================================================================ -->
{#if loading}
  <div class="rb-loading">
    {#if engine === 'duckdb'}
      Loading pivot data from server...
    {:else}
      Loading...
    {/if}
  </div>
{/if}
{#if error}
  <div class="rb-error">{error}</div>
{/if}
{#if serverMetadata && engine === 'duckdb'}
  <div class="rb-server-info">
    ⚡ Server-side processing: {serverMetadata.rowCount} rows in {serverMetadata.executionTimeMs}ms
  </div>
{/if}
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div 
  bind:this={container} 
  class="pvtUi-container" 
  style:display={loading || error ? 'none' : 'block'} 
  on:click={() => openDropdown = false}
  on:keydown={(e) => { if (e.key === 'Escape') openDropdown = false; }}
  role="application"
  aria-label="Pivot Table"
  tabindex="-1"
>
  <table class="pvtUi">
    <tbody>
      {#if horizUnused}
        <!-- Horizontal layout for unused attrs -->
        <tr>
          <!-- Renderer dropdown -->
          <td class="pvtRenderers">
            <div class="pvtDropdown" style="z-index: {openDropdown === 'renderer' ? maxZIndex + 1 : 1}">
              <button 
                type="button"
                class="pvtDropdownValue pvtDropdownCurrent {openDropdown === 'renderer' ? 'pvtDropdownCurrentOpen' : ''}"
                on:click|stopPropagation={() => openDropdown = openDropdown === 'renderer' ? false : 'renderer'}
              >
                <span class="pvtDropdownIcon">{openDropdown === 'renderer' ? '×' : '▾'}</span>
                {rendererName}
              </button>
              {#if openDropdown === 'renderer'}
                <div class="pvtDropdownMenu">
                  {#each rendererNames as name}
                    <button 
                      type="button"
                      class="pvtDropdownValue {name === rendererName ? 'pvtDropdownActiveValue' : ''}"
                      on:click|stopPropagation={() => setRenderer(name)}
                    >
                      {name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </td>
          
          <!-- Unused attributes -->
          <td 
            class="pvtAxisContainer pvtUnused pvtHorizList"
            on:dragover={onDragOver}
            on:drop={onDropUnused}
          >
            {#each unusedAttrs as attr}
              <li 
                draggable="true"
                on:dragstart={(e) => onDragStart(e, attr)}
              >
                <span class="pvtAttr {hasActiveFilter(attr) ? 'pvtFilteredAttribute' : ''}">
                  {attr}
                  <button type="button" class="pvtTriangle" on:click|stopPropagation={() => toggleFilterBox(attr)}>▾</button>
                </span>
                
                {#if openFilterBox === attr}
                  <div 
                    class="pvtFilterBox" 
                    style="z-index: {zIndices[attr] || maxZIndex}"
                    on:click|stopPropagation={() => moveToTop(attr)}
                    on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') openFilterBox = null; }}
                    role="dialog" tabindex="-1"
                    aria-label="Filter {attr}"
                  >
                    <button type="button" class="pvtCloseX" on:click|stopPropagation={() => openFilterBox = null}>×</button>
                    <h4>{attr}</h4>
                    
                    {#if Object.keys(attrValues[attr] || {}).length < menuLimit}
                      <p>
                        <input 
                          type="text" 
                          class="pvtSearch" 
                          placeholder="Filter values"
                          bind:value={filterText}
                        />
                        <br />
                        <button type="button" class="pvtButton" on:click={() => selectAllFiltered(attr)}>Select All</button>
                        <button type="button" class="pvtButton" on:click={() => deselectAllFiltered(attr)}>Deselect All</button>
                      </p>
                      
                      <div class="pvtCheckContainer">
                        {#each Object.keys(attrValues[attr] || {}).filter(matchesFilter).sort(getSort(sorters, attr)) as value}
                          <button 
                            type="button"
                            class="pvtCheckItem {isValueFiltered(attr, value) ? '' : 'selected'}"
                            on:click={() => toggleValue(attr, value)}
                          >
                            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions --><span class="pvtOnly" on:click|stopPropagation={() => selectOnly(attr, value)}>only</span>
                            <span class="pvtOnlySpacer">&nbsp;</span>
                            {value === '' ? '(blank)' : value}
                          </button>
                        {/each}
                      </div>
                    {:else}
                      <p>(too many values to show)</p>
                    {/if}
                  </div>
                {/if}
              </li>
            {/each}
          </td>
        </tr>
        
        <tr>
          <!-- Aggregator -->
          <td class="pvtVals">
            <div class="pvtDropdown" style="z-index: {openDropdown === 'aggregator' ? maxZIndex + 1 : 1}">
              <button 
                type="button"
                class="pvtDropdownValue pvtDropdownCurrent {openDropdown === 'aggregator' ? 'pvtDropdownCurrentOpen' : ''}"
                on:click|stopPropagation={() => openDropdown = openDropdown === 'aggregator' ? false : 'aggregator'}
              >
                <span class="pvtDropdownIcon">{openDropdown === 'aggregator' ? '×' : '▾'}</span>
                {aggregatorName}
              </button>
              {#if openDropdown === 'aggregator'}
                <div class="pvtDropdownMenu">
                  {#each aggregatorOptions as name}
                    <button 
                      type="button"
                      class="pvtDropdownValue {name === aggregatorName ? 'pvtDropdownActiveValue' : ''}"
                      on:click|stopPropagation={() => setAggregator(name)}
                    >
                      {name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            
            <!-- Sort buttons -->
            <button type="button" class="pvtRowOrder" on:click={toggleRowOrder}>{sortIcons[rowOrder].rowSymbol}</button>
            <button type="button" class="pvtColOrder" on:click={toggleColOrder}>{sortIcons[colOrder].colSymbol}</button>
            
            <!-- Value selectors -->
            {#if numValsAllowed > 0}
              <br />
              {#each Array(numValsAllowed) as _, i}
                <div class="pvtDropdown" style="z-index: {openDropdown === `val${i}` ? maxZIndex + 1 : 1}">
                  <button 
                    type="button"
                    class="pvtDropdownValue pvtDropdownCurrent {openDropdown === `val${i}` ? 'pvtDropdownCurrentOpen' : ''}"
                    on:click|stopPropagation={() => openDropdown = openDropdown === `val${i}` ? false : `val${i}`}
                  >
                    <span class="pvtDropdownIcon">{openDropdown === `val${i}` ? '×' : '▾'}</span>
                    {vals[i] || '(select)'}
                  </button>
                  {#if openDropdown === `val${i}`}
                    <div class="pvtDropdownMenu">
                      {#each valOptions as opt}
                        <button 
                          type="button"
                          class="pvtDropdownValue {opt === vals[i] ? 'pvtDropdownActiveValue' : ''}"
                          on:click|stopPropagation={() => setVal(i, opt)}
                        >
                          {opt}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>
                {#if i < numValsAllowed - 1}<br />{/if}
              {/each}
            {/if}
          </td>
          
          <!-- Column attributes -->
          <td 
            class="pvtAxisContainer pvtHorizList pvtCols"
            on:dragover={onDragOver}
            on:drop={onDropCols}
          >
            {#each visibleCols as attr}
              <li draggable="true" on:dragstart={(e) => onDragStart(e, attr)}>
                <span class="pvtAttr {hasActiveFilter(attr) ? 'pvtFilteredAttribute' : ''}">
                  {attr}
                  <button type="button" class="pvtTriangle" on:click|stopPropagation={() => toggleFilterBox(attr)}>▾</button>
                </span>
                
                {#if openFilterBox === attr}
                  <div 
                    class="pvtFilterBox" 
                    style="z-index: {zIndices[attr] || maxZIndex}"
                    on:click|stopPropagation={() => moveToTop(attr)}
                    on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') openFilterBox = null; }}
                    role="dialog" tabindex="-1"
                    aria-label="Filter {attr}"
                  >
                    <button type="button" class="pvtCloseX" on:click|stopPropagation={() => openFilterBox = null}>×</button>
                    <h4>{attr}</h4>
                    
                    {#if Object.keys(attrValues[attr] || {}).length < menuLimit}
                      <p>
                        <input 
                          type="text" 
                          class="pvtSearch" 
                          placeholder="Filter values"
                          bind:value={filterText}
                        />
                        <br />
                        <button type="button" class="pvtButton" on:click={() => selectAllFiltered(attr)}>Select All</button>
                        <button type="button" class="pvtButton" on:click={() => deselectAllFiltered(attr)}>Deselect All</button>
                      </p>
                      
                      <div class="pvtCheckContainer">
                        {#each Object.keys(attrValues[attr] || {}).filter(matchesFilter).sort(getSort(sorters, attr)) as value}
                          <button 
                            type="button"
                            class="pvtCheckItem {isValueFiltered(attr, value) ? '' : 'selected'}"
                            on:click={() => toggleValue(attr, value)}
                          >
                            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions --><span class="pvtOnly" on:click|stopPropagation={() => selectOnly(attr, value)}>only</span>
                            <span class="pvtOnlySpacer">&nbsp;</span>
                            {value === '' ? '(blank)' : value}
                          </button>
                        {/each}
                      </div>
                    {:else}
                      <p>(too many values to show)</p>
                    {/if}
                  </div>
                {/if}
              </li>
            {/each}
          </td>
        </tr>
        
        <tr>
          <!-- Row attributes -->
          <td 
            class="pvtAxisContainer pvtVertList pvtRows"
            on:dragover={onDragOver}
            on:drop={onDropRows}
          >
            {#each visibleRows as attr}
              <li draggable="true" on:dragstart={(e) => onDragStart(e, attr)}>
                <span class="pvtAttr {hasActiveFilter(attr) ? 'pvtFilteredAttribute' : ''}">
                  {attr}
                  <button type="button" class="pvtTriangle" on:click|stopPropagation={() => toggleFilterBox(attr)}>▾</button>
                </span>
                
                {#if openFilterBox === attr}
                  <div 
                    class="pvtFilterBox" 
                    style="z-index: {zIndices[attr] || maxZIndex}"
                    on:click|stopPropagation={() => moveToTop(attr)}
                    on:keydown|stopPropagation={(e) => { if (e.key === 'Escape') openFilterBox = null; }}
                    role="dialog" tabindex="-1"
                    aria-label="Filter {attr}"
                  >
                    <button type="button" class="pvtCloseX" on:click|stopPropagation={() => openFilterBox = null}>×</button>
                    <h4>{attr}</h4>
                    
                    {#if Object.keys(attrValues[attr] || {}).length < menuLimit}
                      <p>
                        <input 
                          type="text" 
                          class="pvtSearch" 
                          placeholder="Filter values"
                          bind:value={filterText}
                        />
                        <br />
                        <button type="button" class="pvtButton" on:click={() => selectAllFiltered(attr)}>Select All</button>
                        <button type="button" class="pvtButton" on:click={() => deselectAllFiltered(attr)}>Deselect All</button>
                      </p>
                      
                      <div class="pvtCheckContainer">
                        {#each Object.keys(attrValues[attr] || {}).filter(matchesFilter).sort(getSort(sorters, attr)) as value}
                          <button 
                            type="button"
                            class="pvtCheckItem {isValueFiltered(attr, value) ? '' : 'selected'}"
                            on:click={() => toggleValue(attr, value)}
                          >
                            <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions --><span class="pvtOnly" on:click|stopPropagation={() => selectOnly(attr, value)}>only</span>
                            <span class="pvtOnlySpacer">&nbsp;</span>
                            {value === '' ? '(blank)' : value}
                          </button>
                        {/each}
                      </div>
                    {:else}
                      <p>(too many values to show)</p>
                    {/if}
                  </div>
                {/if}
              </li>
            {/each}
          </td>
          
          <!-- Output -->
          <td class="pvtOutput" bind:this={outputContainer}></td>
        </tr>
      {:else}
        <!-- Vertical layout for unused attrs -->
        <tr>
          <td class="pvtRenderers">
            <div class="pvtDropdown" style="z-index: {openDropdown === 'renderer' ? maxZIndex + 1 : 1}">
              <button 
                type="button"
                class="pvtDropdownValue pvtDropdownCurrent {openDropdown === 'renderer' ? 'pvtDropdownCurrentOpen' : ''}"
                on:click|stopPropagation={() => openDropdown = openDropdown === 'renderer' ? false : 'renderer'}
              >
                <span class="pvtDropdownIcon">{openDropdown === 'renderer' ? '×' : '▾'}</span>
                {rendererName}
              </button>
              {#if openDropdown === 'renderer'}
                <div class="pvtDropdownMenu">
                  {#each rendererNames as name}
                    <button 
                      type="button"
                      class="pvtDropdownValue {name === rendererName ? 'pvtDropdownActiveValue' : ''}"
                      on:click|stopPropagation={() => setRenderer(name)}
                    >
                      {name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </td>
          
          <td class="pvtVals">
            <div class="pvtDropdown" style="z-index: {openDropdown === 'aggregator' ? maxZIndex + 1 : 1}">
              <button 
                type="button"
                class="pvtDropdownValue pvtDropdownCurrent {openDropdown === 'aggregator' ? 'pvtDropdownCurrentOpen' : ''}"
                on:click|stopPropagation={() => openDropdown = openDropdown === 'aggregator' ? false : 'aggregator'}
              >
                <span class="pvtDropdownIcon">{openDropdown === 'aggregator' ? '×' : '▾'}</span>
                {aggregatorName}
              </button>
              {#if openDropdown === 'aggregator'}
                <div class="pvtDropdownMenu">
                  {#each aggregatorOptions as name}
                    <button 
                      type="button"
                      class="pvtDropdownValue {name === aggregatorName ? 'pvtDropdownActiveValue' : ''}"
                      on:click|stopPropagation={() => setAggregator(name)}
                    >
                      {name}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            <button type="button" class="pvtRowOrder" on:click={toggleRowOrder}>{sortIcons[rowOrder].rowSymbol}</button>
            <button type="button" class="pvtColOrder" on:click={toggleColOrder}>{sortIcons[colOrder].colSymbol}</button>
          </td>
          
          <td 
            class="pvtAxisContainer pvtHorizList pvtCols"
            on:dragover={onDragOver}
            on:drop={onDropCols}
          >
            {#each visibleCols as attr}
              <li draggable="true" on:dragstart={(e) => onDragStart(e, attr)}>
                <span class="pvtAttr {hasActiveFilter(attr) ? 'pvtFilteredAttribute' : ''}">
                  {attr}
                  <button type="button" class="pvtTriangle" on:click|stopPropagation={() => toggleFilterBox(attr)}>▾</button>
                </span>
              </li>
            {/each}
          </td>
        </tr>
        
        <tr>
          <td 
            class="pvtAxisContainer pvtVertList pvtUnused"
            on:dragover={onDragOver}
            on:drop={onDropUnused}
          >
            {#each unusedAttrs as attr}
              <li draggable="true" on:dragstart={(e) => onDragStart(e, attr)}>
                <span class="pvtAttr {hasActiveFilter(attr) ? 'pvtFilteredAttribute' : ''}">
                  {attr}
                  <button type="button" class="pvtTriangle" on:click|stopPropagation={() => toggleFilterBox(attr)}>▾</button>
                </span>
              </li>
            {/each}
          </td>
          
          <td 
            class="pvtAxisContainer pvtVertList pvtRows"
            on:dragover={onDragOver}
            on:drop={onDropRows}
          >
            {#each visibleRows as attr}
              <li draggable="true" on:dragstart={(e) => onDragStart(e, attr)}>
                <span class="pvtAttr {hasActiveFilter(attr) ? 'pvtFilteredAttribute' : ''}">
                  {attr}
                  <button type="button" class="pvtTriangle" on:click|stopPropagation={() => toggleFilterBox(attr)}>▾</button>
                </span>
              </li>
            {/each}
          </td>
          
          <td class="pvtOutput" bind:this={outputContainer}></td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<script context="module" lang="ts">
  // CSS embedded for shadow DOM
  const PIVOT_CSS = `
.pvtUi-container {
  font-family: Verdana, sans-serif;
}
/* Reset button styles for all buttons in component */
.pvtUi-container button {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
}
.pvtUi {
  color: #2a3f5f;
  font-family: Verdana;
  border-collapse: collapse;
}
.pvtUi select {
  user-select: none;
}
.pvtUi td.pvtOutput {
  vertical-align: top;
}
table.pvtTable {
  font-size: 8pt;
  text-align: left;
  border-collapse: collapse;
  margin-top: 3px;
  margin-left: 3px;
  font-family: Verdana;
}
table.pvtTable thead tr th,
table.pvtTable tbody tr th {
  background-color: #ebf0f8;
  border: 1px solid #c8d4e3;
  font-size: 8pt;
  padding: 5px;
}
table.pvtTable .pvtColLabel {
  text-align: center;
}
table.pvtTable .pvtTotalLabel {
  text-align: right;
}
table.pvtTable tbody tr td {
  color: #2a3f5f;
  padding: 5px;
  background-color: #fff;
  border: 1px solid #c8d4e3;
  vertical-align: top;
  text-align: right;
}
.pvtTotal, .pvtGrandTotal {
  font-weight: bold;
}
button.pvtRowOrder, button.pvtColOrder {
  cursor: pointer;
  width: 15px;
  margin-left: 5px;
  display: inline-block;
  user-select: none;
  background: none;
  border: none;
  font-size: inherit;
  color: inherit;
}
.pvtAxisContainer, .pvtVals {
  border: 1px solid #a2b1c6;
  background: #f2f5fa;
  padding: 5px;
  min-width: 20px;
  min-height: 20px;
}
.pvtRenderers {
  padding-left: 5px;
  user-select: none;
}
.pvtDropdown {
  display: inline-block;
  position: relative;
  user-select: none;
  margin: 3px;
}
.pvtDropdownIcon {
  float: right;
  color: #a2b1c6;
}
.pvtDropdownCurrent {
  text-align: left;
  border: 1px solid #a2b1c6;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  width: 210px;
  box-sizing: border-box;
  background: white;
  padding: 2px 5px;
  cursor: pointer;
  font-size: 12px;
}
.pvtDropdownCurrentOpen {
  border-radius: 4px 4px 0 0;
}
.pvtDropdownMenu {
  background: white;
  position: absolute;
  width: 100%;
  min-width: 200px;
  margin-top: -1px;
  border-radius: 0 0 4px 4px;
  border: 1px solid #a2b1c6;
  border-top: 1px solid #dfe8f3;
  box-sizing: border-box;
  max-height: 300px;
  overflow-y: auto;
}
.pvtDropdownValue {
  padding: 2px 5px;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  display: block;
  width: 100%;
  box-sizing: border-box;
}
.pvtDropdownValue:hover {
  background: #f2f5fa;
}
.pvtDropdownActiveValue {
  background: #ebf0f8;
}
.pvtVals {
  text-align: center;
  white-space: nowrap;
  vertical-align: top;
  padding-bottom: 12px;
}
.pvtRows {
  height: 35px;
}
.pvtAxisContainer li {
  padding: 8px 6px;
  list-style-type: none;
  cursor: move;
}
.pvtAxisContainer li.pvtPlaceholder {
  border-radius: 5px;
  padding: 3px 15px;
  border: 1px dashed #a2b1c6;
}
.pvtAxisContainer li span.pvtAttr {
  background: #f3f6fa;
  border: 1px solid #c8d4e3;
  padding: 2px 5px;
  white-space: nowrap;
  border-radius: 5px;
  user-select: none;
}
button.pvtTriangle {
  cursor: pointer;
  color: #506784;
  background: none;
  border: none;
  padding: 0 2px;
  font-size: inherit;
}
.pvtHorizList li {
  display: inline-block;
}
.pvtVertList {
  vertical-align: top;
}
.pvtFilteredAttribute {
  font-style: italic;
}
.pvtFilterBox {
  z-index: 100;
  width: 300px;
  border: 1px solid #506784;
  background-color: #fff;
  position: absolute;
  text-align: center;
  user-select: none;
  min-height: 100px;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.pvtFilterBox h4 {
  margin: 15px 0 10px;
}
.pvtFilterBox p {
  margin: 10px auto;
}
.pvtFilterBox input[type='text'] {
  width: 230px;
  padding: 5px;
  border: 1px solid #c8d4e3;
  border-radius: 4px;
  margin-bottom: 5px;
}
.pvtCheckContainer {
  text-align: left;
  font-size: 14px;
  white-space: nowrap;
  overflow-y: scroll;
  width: 100%;
  max-height: 30vh;
  border-top: 1px solid #dfe8f3;
}
.pvtCheckItem {
  display: block;
  width: 100%;
  margin: 0;
  margin-bottom: 1px;
  padding: 3px;
  cursor: pointer;
  text-align: left;
  background: none;
  border: none;
  font-size: 14px;
}
.pvtCheckItem.selected {
  background: #ebf0f8;
}
.pvtCheckItem:hover .pvtOnly {
  display: block;
}
.pvtCheckItem:hover .pvtOnlySpacer {
  display: none;
}
.pvtOnly {
  display: none;
  width: 35px;
  float: left;
  font-size: 12px;
  padding-left: 5px;
  cursor: pointer;
  color: #119dff;
}
.pvtOnlySpacer {
  display: block;
  width: 35px;
  float: left;
}
button.pvtCloseX {
  position: absolute;
  right: 8px;
  top: 5px;
  font-size: 18px;
  cursor: pointer;
  color: #506784;
  background: none;
  border: none;
  padding: 0;
}
button.pvtButton {
  color: #506784;
  border-radius: 5px;
  padding: 3px 6px;
  background: #f2f5fa;
  border: 1px solid #c8d4e3;
  font-size: 14px;
  margin: 3px;
  cursor: pointer;
}
button.pvtButton:hover {
  background: #e2e8f0;
  border-color: #a2b1c6;
}
.pvtError {
  color: #e15759;
  padding: 20px;
  text-align: center;
}
.pvtOutput canvas {
  max-width: 100%;
  max-height: 400px;
}
`;
</script>

<style>
  :host {
    display: block;
  }
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
  .rb-server-info {
    padding: 0.5rem 1rem;
    text-align: center;
    font-size: 0.875rem;
    color: #059669;
    background: #ecfdf5;
    border: 1px solid #10b981;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }
</style>
