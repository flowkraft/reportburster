<svelte:options customElement="rb-tabulator" />

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { TabulatorFull as Tabulator, type Options, type ColumnDefinition } from 'tabulator-tables';
  // Import CSS as raw string for manual injection
  import tabulatorCss from 'tabulator-tables/dist/css/tabulator.min.css?raw';
  import { fetchQueryData } from './services/mockApiService';

  export let id: string = 'default';

  let tableContainer: HTMLDivElement;
  let table: Tabulator | null = null;

  onMount(async () => {
    await tick(); // Wait for DOM updates

    if (tableContainer) {
      // --- Manual CSS Injection Start ---
      const shadowRoot = tableContainer.getRootNode();
      if (shadowRoot instanceof ShadowRoot) {
         // Check if styles already injected (to prevent duplicates on HMR)
         if (!shadowRoot.querySelector('style[data-vite-dev-id*="tabulator.min.css"]')) {
            const styleTag = document.createElement('style');
            styleTag.textContent = tabulatorCss;
            // Add an attribute to potentially identify it later if needed
            styleTag.setAttribute('data-vite-dev-id', 'tabulator.min.css');
            shadowRoot.appendChild(styleTag);
            console.log("Manually injected styles into Shadow DOM.");
         }
      } else {
         console.error("Could not find ShadowRoot to inject styles.");
      }
      // --- Manual CSS Injection End ---

      // --- Initialize Tabulator ---
      try {
        console.log("Component mounted, fetching data...");
        const response = await fetchQueryData(id);
        console.log("Mock response received:", response);

        // --- Map Server Config to Tabulator Options ---
        const tabulatorOptions: Options = {
          data: response.data,
          height: response.config.height || "300px", // Use height from config or default

          // Feature 1: Pagination Mapping
          pagination: response.config.pagination?.enabled ?? false, // Map enabled flag
          paginationMode: response.config.pagination?.mode ?? "local", // Map mode
          paginationSize: response.config.pagination?.size ?? 10, // Map page size
          paginationSizeSelector: response.config.pagination?.sizes ?? false, // Map available sizes

          // Feature 3: Sorting Mapping
          initialSort: response.config.sorting?.initial, // Map initial sort

          // Feature 4: Appearance Mapping
          layout: response.config.appearance?.layout ?? "fitData", // Map layout
          // headerVisible: response.config.appearance?.headerVisible ?? true, // Map header visibility

          // Feature 2: Column Definitions (Process visibility and order)
          columns: response.columns
            ?.filter((col: any) => col.visible !== false) // Filter out non-visible columns
            ?.sort((a: any, b: any) => (a.position ?? Infinity) - (b.position ?? Infinity)) // Sort by position
            ?.map((col: any) => {
              // Remove custom 'position' property before passing to Tabulator
              const { position, ...tabulatorColDef } = col;
              return tabulatorColDef as ColumnDefinition;
            }),
        };
        // --- End Mapping ---

        console.log("Initializing Tabulator with mapped options:", tabulatorOptions);

        table = new Tabulator(tableContainer, tabulatorOptions);
        console.log("Tabulator initialized.");

      } catch (error) {
        console.error('Error initializing table:', error);
      }
      // --- End Initialize Tabulator ---

    } else {
      console.error("Table container element not found!");
    }
  });
</script>

<!-- No <style> block needed here -->
<div bind:this={tableContainer}></div>