<svelte:options customElement={{ tag: "rb-value", shadow: "none" }} />

<script context="module" lang="ts">
  // Module-level: shared across ALL <rb-value> instances on the page.
  // Deduplicates data requests when N components share the same reportCode + componentId + params.
  const _dataCache = new Map<string, Promise<any>>();

  function fetchDataCached(url: string, headers: Record<string, string>): Promise<any> {
    let p = _dataCache.get(url);
    if (p) return p;
    p = fetch(url, { headers })
      .then(r => { if (!r.ok) throw new Error(`Data fetch failed: ${r.status}`); return r.json(); })
      .catch(e => { _dataCache.delete(url); throw e; });
    _dataCache.set(url, p);
    return p;
  }

  // Invalidate all cached data (called on param change / reload)
  function invalidateDataCache() {
    _dataCache.clear();
  }
</script>

<script lang="ts">
  import { onMount, tick } from 'svelte';

  // Props — same pattern as all other rb-* components
  export let reportCode: string = '';
  export let apiBaseUrl: string = '';
  export let apiKey: string = '';
  export let componentId: string = '';
  export let field: string = '';
  export let format: string = '';         // 'currency', 'number', 'percent', 'date', or ''
  export let reportParams: Record<string, string> = {};

  // Internal state
  let container: HTMLSpanElement;
  let displayValue: string = '';
  let loading = true;
  let error: string | null = null;

  function formatValue(raw: any, fmt: string): string {
    if (raw === null || raw === undefined) return '';
    const str = String(raw);

    switch (fmt) {
      case 'currency': {
        const num = parseFloat(str.replace(/[^0-9.\-]/g, ''));
        if (isNaN(num)) return str;
        return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }
      case 'number': {
        const num = parseFloat(str.replace(/[^0-9.\-]/g, ''));
        if (isNaN(num)) return str;
        return num.toLocaleString('en-US');
      }
      case 'percent': {
        const num = parseFloat(str.replace(/[^0-9.\-]/g, ''));
        if (isNaN(num)) return str;
        return Math.round(num * 100) + '%';
      }
      case 'date': {
        const d = new Date(str);
        if (isNaN(d.getTime())) return str;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      }
      default:
        return str;
    }
  }

  async function fetchAndDisplay() {
    if (!reportCode || !apiBaseUrl || !field) return;

    loading = true;
    error = null;

    try {
      const headers: Record<string, string> = {};

      const dataQueryParams = new URLSearchParams(reportParams as Record<string, string>);
      if (componentId) dataQueryParams.set('componentId', componentId);
      const qs = dataQueryParams.toString();
      const dataUrl = qs
        ? `${apiBaseUrl}/reports/${reportCode}/data?${qs}`
        : `${apiBaseUrl}/reports/${reportCode}/data`;

      const dataResult = await fetchDataCached(dataUrl, headers);
      const rows = Array.isArray(dataResult) ? dataResult : (dataResult?.data || []);

      if (rows.length > 0 && field in rows[0]) {
        displayValue = formatValue(rows[0][field], format);
      } else {
        displayValue = '';
      }
    } catch (err: any) {
      error = err.message || 'Failed to load value';
      console.error('[rb-value] fetch error:', err);
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    await tick();

    // Read attributes from host element (light DOM)
    const hostEl = container?.closest('rb-value');
    if (hostEl) {
      if (!reportCode) reportCode = hostEl.getAttribute('report-code') || '';
      if (!apiBaseUrl) apiBaseUrl = hostEl.getAttribute('api-base-url') || '';
      if (!apiKey) apiKey = hostEl.getAttribute('api-key') || '';
      if (!componentId) componentId = hostEl.getAttribute('component-id') || '';
      if (!field) field = hostEl.getAttribute('field') || '';
      if (!format) format = hostEl.getAttribute('format') || '';
      if (!Object.keys(reportParams).length) {
        const rp = hostEl.getAttribute('report-params');
        if (rp) try { reportParams = JSON.parse(rp); } catch(e) {}
      }
    }

    await fetchAndDisplay();

    // Listen for parameter submit events (from rb-parameters via rb-report)
    // Walk up to find the dashboard/report root and listen for submit
    const reportRoot = container?.closest('rb-report') || container?.closest('rb-dashboard');
    if (reportRoot) {
      reportRoot.addEventListener('submit', ((e: CustomEvent) => {
        // Update reportParams from the submit event and re-fetch
        if (e.detail) {
          reportParams = { ...reportParams, ...e.detail };
        }
        invalidateDataCache();
        fetchAndDisplay();
      }) as EventListener);
    }

    // Also listen for rb-value-reload custom event (for standalone usage)
    document.addEventListener('rb-value-reload', ((e: CustomEvent) => {
      if (!e.detail?.reportCode || e.detail.reportCode === reportCode) {
        if (e.detail?.params) {
          reportParams = { ...reportParams, ...e.detail.params };
        }
        invalidateDataCache();
        fetchAndDisplay();
      }
    }) as EventListener);
  });
</script>

<span bind:this={container} class="rb-value-root">
  {#if loading}
    <span class="rb-value-loading">...</span>
  {:else if error}
    <span class="rb-value-error" title={error}>--</span>
  {:else}
    {displayValue}
  {/if}
</span>

<style>
  .rb-value-root {
    display: inline;
  }
  .rb-value-loading {
    opacity: 0.4;
  }
  .rb-value-error {
    color: #dc2626;
    cursor: help;
  }
</style>
