<svelte:options customElement={{ tag: "rb-drill-rows", shadow: "none" }} />

<script lang="ts">
  /**
   * The rows behind something that was clicked, in a panel over the widget it was clicked in.
   *
   * One panel for every drill: a cube's number (W4.6, `RbCubeRenderer`) and a Visual-tab widget's
   * bar or table row (#21, `drill-through.ts` on a published dashboard, `useDrillRows` on the
   * canvas). Whoever opens it asks for the rows and hands them over; the panel only shows them, and
   * says so when they are still coming, could not be read, or are only the first of more.
   */
  import { createEventDispatcher } from 'svelte';

  /** The ids of the panel's parts: `<prefix>Modal`, `<prefix>Title`, `<prefix>Error`, `<prefix>Truncated`. */
  export let idPrefix: string = 'drill';
  /** The id of the close button. */
  export let closeId: string = 'btnDrillRowsClose';
  export let heading: string = '';
  export let rows: any[] = [];
  /** Tabulator columns; none means one per field of the rows, titled by its name. */
  export let columns: any[] = [];
  export let loading: boolean = false;
  export let error: string = '';
  export let truncated: boolean = false;

  const dispatch = createEventDispatcher();

  $: shownColumns = columns && columns.length > 0
    ? columns
    : Object.keys(rows?.[0] ?? {}).map((field) => ({ title: field, field }));
</script>

<div id="{idPrefix}Modal" class="rb-drill-modal">
  <div class="rb-drill-head">
    <span id="{idPrefix}Title" class="rb-drill-title">{heading}</span>
    <button type="button" id={closeId} class="rb-drill-close" title="Close"
            on:click={() => dispatch('close')}>×</button>
  </div>
  {#if error}
    <div id="{idPrefix}Error" class="rb-drill-note rb-drill-bad">{error}</div>
  {:else if loading}
    <div class="rb-drill-note">Answering…</div>
  {:else}
    {#if truncated}
      <div id="{idPrefix}Truncated" class="rb-drill-note">First {rows.length} rows</div>
    {/if}
    <rb-tabulator data={rows} columns={shownColumns}></rb-tabulator>
  {/if}
</div>

<style>
  .rb-drill-modal {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 24px;
    z-index: 20;
    border: 1px solid color-mix(in oklab, currentColor 20%, transparent);
    border-radius: 4px;
    padding: 8px;
    background: Canvas;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  }
  .rb-drill-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .rb-drill-title {
    font-weight: 600;
    flex: 1;
  }
  .rb-drill-close {
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font-size: 16px;
    line-height: 1;
    padding: 0 4px;
  }
  .rb-drill-note {
    font-size: 11px;
    opacity: 0.75;
    margin-top: 6px;
  }
  .rb-drill-bad {
    color: var(--color-error, #d9534f);
    opacity: 1;
  }
</style>
