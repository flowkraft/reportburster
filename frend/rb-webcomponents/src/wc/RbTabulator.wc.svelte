<svelte:options customElement="rb-tabulator" accessors={true} />

<script lang="ts">
  import {
    onMount,
    afterUpdate,
    onDestroy,
    tick,
    createEventDispatcher,
  } from 'svelte';
  import {
    TabulatorFull as Tabulator,
    type Options,
    type ColumnDefinition,
  } from 'tabulator-tables';

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
  export let data: any[] = [];
  export let columns: ColumnDefinition[] = [];
  export let options: any = {};

  // ============================================================================
  // Internal state for self-fetch mode
  // ============================================================================
  let loading = false;
  let error: string | null = null;
  
  // Raw DSL source code (exposed for Configuration tab)
  export let configDsl: string = '';

  let container: HTMLDivElement;
  let table: Tabulator;
  let isReady = false;
  // keep a resolved columns reference (so we can avoid accidental overrides)
  let resolvedColumns: ColumnDefinition[] | undefined;

  // recompute resolved columns reactively when `columns` or `options` prop changes
  $: resolvedColumns = (columns && columns.length) ? columns : ((Array.isArray(options?.columns) && (options as any).columns.length) ? (options as any).columns : undefined);
  const dispatch = createEventDispatcher();

  // workaround ResizeObserver in shadow DOM
  function patchResizeObserver() {
    if (typeof ResizeObserver === 'undefined') return;

    try {
      const proto = ResizeObserver.prototype as any;
      // guard to avoid patching multiple times
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
          // swallow to avoid breaking the app; optionally log in dev
          // console.warn('ResizeObserver.observe skipped non-element target', err);
        }
        // no-op for non-Element
      };

      proto.unobserve = function (target: any) {
        try {
          if (target instanceof Element) {
            return origUnobserve.call(this, target);
          }
        } catch (err) {
          // swallow to avoid throwing on cleanup
          // console.warn('ResizeObserver.unobserve skipped non-element target', err);
        }
        // no-op for non-Element
      };

      proto.disconnect = function () {
        try {
          return origDisconnect.call(this);
        } catch (err) {
          // swallow - do not crash on disconnect
        }
      };
    } catch (err) {
      // No-op - patch failed silently
      // console.error('Error patching ResizeObserver:', err);
    }
  }

  // only once tableBuilt has fired do we sync data/columns
  function updateTable() {
    if (!isReady || !table) return;

    try {
      if (resolvedColumns && resolvedColumns.length) {
        table.setColumns(resolvedColumns);
      }
      // Debug log on updates for easier diagnosis if table is empty
      try {
        // eslint-disable-next-line no-console
        console.debug('rb-tabulator: updateTable', { resolvedColumns, dataLength: data?.length });
      } catch (e) {}
      
      //console.log(`updateTable table.replaceData: ${JSON.stringify(data)}`);
      // replace entire dataset
      if (Array.isArray(data)) {
        table.replaceData(data);
      } else {
        try { console.warn('rb-tabulator: replaceData skipped because `data` is not an array', data); } catch (e) {}
      }
      // table.redraw();
    } catch (err) {
      console.error('rb-tabulator update error', err);
      dispatch('tableError', { message: String(err) });
    }
  }

  onMount(async () => {
    patchResizeObserver();
    await tick(); // ensure <div> is in the DOM
    
    // Read attributes directly from host element (Svelte props may not be populated yet)
    // Navigate from container up through shadow DOM to host element
    const shadowRoot = container?.getRootNode();
    const hostEl = (shadowRoot as ShadowRoot)?.host;
    if (hostEl) {
      if (!reportCode) reportCode = hostEl.getAttribute('report-code') || '';
      if (!apiBaseUrl) apiBaseUrl = hostEl.getAttribute('api-base-url') || '';
      if (!apiKey) apiKey = hostEl.getAttribute('api-key') || '';
    }
    
    // DEBUG: Log prop values after reading from attributes
    console.log('[rb-tabulator] onMount - props after reading attributes:');
    console.log('[rb-tabulator] reportCode =', JSON.stringify(reportCode));
    console.log('[rb-tabulator] apiBaseUrl =', JSON.stringify(apiBaseUrl));
    console.log('[rb-tabulator] apiKey =', JSON.stringify(apiKey));

    if (!container) {
      dispatch('initError', { message: 'Missing container element' });
      return;
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
      
      // DEBUG: Log what we're about to call
      console.log('[rb-tabulator] Self-fetch mode activated');
      console.log('[rb-tabulator] reportCode:', reportCode);
      console.log('[rb-tabulator] apiBaseUrl:', apiBaseUrl);
      console.log('[rb-tabulator] apiKey:', apiKey ? '(set)' : '(not set)');
      
      try {
        // Fetch config
        const configUrl = `${apiBaseUrl}/reports/${reportCode}/config`;
        console.log('[rb-tabulator] Fetching config from:', configUrl);
        const configRes = await fetch(configUrl, { headers });
        console.log('[rb-tabulator] Config response status:', configRes.status);
        if (!configRes.ok) {
          const errorText = await configRes.text();
          console.error('[rb-tabulator] Config error response:', errorText);
          throw new Error(`Config fetch failed: ${configRes.status}`);
        }
        const config = await configRes.json();
        console.log('[rb-tabulator] Config received:', config);
        
        // Apply tabulator options from config
        if (config.tabulatorOptions) {
          options = config.tabulatorOptions;
        }
        
        // Store raw DSL for Configuration tab display
        if (config.tabulatorDsl) {
          configDsl = config.tabulatorDsl;
        }
        
        // Fetch data (GET with empty query params for initial load)
        const dataUrl = `${apiBaseUrl}/reports/${reportCode}/data`;
        console.log('[rb-tabulator] Fetching data from:', dataUrl);
        const dataRes = await fetch(dataUrl, { headers });
        console.log('[rb-tabulator] Data response status:', dataRes.status);
        if (!dataRes.ok) {
          const errorText = await dataRes.text();
          console.error('[rb-tabulator] Data error response:', errorText);
          throw new Error(`Data fetch failed: ${dataRes.status}`);
        }
        const dataResult = await dataRes.json();
        // Backend returns { reportData: [...] }, extract the array
        data = Array.isArray(dataResult) ? dataResult : (dataResult?.reportData || []);
        console.log('[rb-tabulator] Data received, rows:', data.length);
        
        // Dispatch events for config and data loaded
        dispatch('configLoaded', { configDsl, config });
        dispatch('dataFetched', { data });
        
      } catch (err: any) {
        error = err.message || 'Failed to load report';
        console.error('rb-tabulator self-fetch error:', err);
        dispatch('fetchError', { message: error });
        loading = false;
        return;
      }
      loading = false;
      // Wait for Svelte to re-render after state changes
      await tick();
    }

    // inject Tabulator CSS into shadow root
    if (!container) {
      console.error('[rb-tabulator] Container not available for CSS injection');
      return;
    }
    const root = container.getRootNode();
    if (root instanceof ShadowRoot) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator.min.css';
      root.appendChild(link);
    }

    // pass initial data so we never touch setData too early
    const mergedOpts = Object.assign({}, options || {});
    // prefer explicit columns/data passed to webcomponent; otherwise layoutOptions may supply them
    // Only apply columns from layoutOptions when the provided columns are a non-empty array
    resolvedColumns = (columns && columns.length) ? columns : ((Array.isArray(mergedOpts.columns) && mergedOpts.columns.length) ? mergedOpts.columns : undefined);
    const opts: Options = Object.assign({}, mergedOpts, {
      data: (Array.isArray(data) ? data : []), // data from property takes precedence only if it's an array
      layout: mergedOpts.layout || 'fitColumns',
      autoColumns: (mergedOpts.autoColumns !== undefined) ? mergedOpts.autoColumns : !columns?.length,
      ...(resolvedColumns ? { columns: resolvedColumns } : {}),
    });

    // Debugging helper (safe to leave - helps diagnose issues in-browser)
    try {
      // eslint-disable-next-line no-console
      console.debug('rb-tabulator: init opts', { opts, data, columns, mergedOpts });
    } catch (e) {
      // ignore
    }

    // if layoutOptions.width was provided, apply it to the container
    if (mergedOpts.width) {
      try {
        container.style.width = String(mergedOpts.width);
      } catch (e) {
        // ignore
      }
    }

    try {
      table = new Tabulator(container, opts);

      // wait for Tabulator’s first render
      table.on('tableBuilt', () => {
        isReady = true;
        dispatch('ready', { table });
        // sync any props that arrived before build
        updateTable();
      });
      // common handlers we want to forward to Angular
      table.on('rowClick', (e, row) => dispatch('rowClick', { event: e, row, rowData: row.getData() }));
      table.on('dataLoaded', (d) => dispatch('dataLoaded', { data: d }));
    } catch (err) {
      console.error('rb-tabulator init error', err);
      dispatch('initError', { message: String(err) });
    }
  });

  afterUpdate(() => {
    _afterUpdateCount++;
    const now = Date.now();
    // Log at most once per second
    if (now - _lastAfterUpdateLogTime > 1000) {
      console.log('[DEBUG] rb-tabulator afterUpdate called', _afterUpdateCount, 'times total');
      _lastAfterUpdateLogTime = now;
    }
    // Warn if called excessively
    if (_afterUpdateCount > 100 && _afterUpdateCount % 100 === 0) {
      console.warn('[DEBUG] WARNING: rb-tabulator afterUpdate called', _afterUpdateCount, 'times - possible infinite loop!');
    }
    updateTable();
  });

  onDestroy(() => {
    if (table) {
      try {
        table.destroy();
        table = null;
      } catch (err) {
        console.error('Error destroying table:', err);
      }
    }
  });

  export { updateTable as updateTable };
  
  // Public method to fetch data with parameters (for use after initial load)
  export async function fetchData(params: Record<string, any> = {}) {
    if (!reportCode || !apiBaseUrl) {
      console.warn('rb-tabulator: fetchData requires reportCode and apiBaseUrl');
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
      
      // Update tabulator options from fresh config
      if (config.tabulatorOptions) {
        options = config.tabulatorOptions;
        // Update resolved columns from new config
        resolvedColumns = (columns && columns.length) ? columns : 
          ((Array.isArray(options?.columns) && options.columns.length) ? options.columns : undefined);
      }
      
      // Update raw DSL for Configuration tab
      if (config.tabulatorDsl) {
        configDsl = config.tabulatorDsl;
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
      
      // Update the table with new columns and data
      if (isReady && table) {
        if (resolvedColumns && resolvedColumns.length) {
          table.setColumns(resolvedColumns);
        }
        table.replaceData(data);
      }
      
      dispatch('dataFetched', { data });
    } catch (err: any) {
      error = err.message || 'Failed to fetch data';
      dispatch('fetchError', { message: error });
    }
    loading = false;
  }
</script>

{#if loading}
  <div class="rb-loading">Loading...</div>
{/if}
{#if error}
  <div class="rb-error">{error}</div>
{/if}
<div bind:this={container} style:display={loading || error ? 'none' : 'block'}></div>

<style>
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
