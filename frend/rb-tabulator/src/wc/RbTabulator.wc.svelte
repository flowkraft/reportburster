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

  // public props
  export let data: any[] = [];
  export let columns: ColumnDefinition[] = [];
  export let loading: boolean = false;

  let container: HTMLDivElement;
  let table: Tabulator;
  let isReady = false;
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
      if (columns.length) {
        table.setColumns(columns);
      }
      
      //console.log(`updateTable table.replaceData: ${JSON.stringify(data)}`);
      // replace entire dataset
      table.replaceData(data);
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
    const opts: Options = {
      data,                 // initial rows
      layout: 'fitColumns',
      autoColumns: !columns?.length,
      ...(columns?.length ? { columns } : {}),
    };

    try {
      table = new Tabulator(container, opts);

      // wait for Tabulator’s first render
      table.on('tableBuilt', () => {
        isReady = true;
        dispatch('ready');
        // sync any props that arrived before build
        updateTable();
      });
    } catch (err) {
      console.error('rb-tabulator init error', err);
      dispatch('initError', { message: String(err) });
    }
  });

  afterUpdate(() => {
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
