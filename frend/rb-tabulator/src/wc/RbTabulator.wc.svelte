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

  // public props
  export let data: any[] = [];
  export let columns: ColumnDefinition[] = [];
  export let loading: boolean = false;
  export let options: any = {};

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

  // only once tableBuilt has fired do we sync data/loading/columns
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

      // ✏️ Updated for v6 loader methods:
      //table.setLoader(loading);
    } catch (err) {
      console.error('rb-tabulator update error', err);
      dispatch('tableError', { message: String(err) });
    }
  }

  onMount(async () => {
    patchResizeObserver();
    await tick(); // ensure <div> is in the DOM

    if (!container) {
      dispatch('initError', { message: 'Missing container element' });
      return;
    }

    // inject Tabulator CSS into shadow root
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
</script>

<div bind:this={container}></div>
