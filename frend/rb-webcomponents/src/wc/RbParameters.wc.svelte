<svelte:options customElement="rb-parameters" accessors={true} />

<script lang="ts">
  import { onMount, createEventDispatcher, tick } from 'svelte';

  // ParamRef type for cross-field references
  interface ParamRef {
    name: string;
  }

  type MaybeRef<T> = T | ParamRef;

  // Parameter metadata interface
  export interface ParamMeta {
    id: string;
    type: string;
    defaultValue?: any;
    constraints?: { [k: string]: MaybeRef<any> };
    uiHints?: { [k: string]: any };
    label?: string;
    description?: string;
  }

  // ============================================================================
  // Hybrid Mode Props - when reportCode is provided, component self-fetches
  // ============================================================================
  export let reportCode: string = '';
  export let apiBaseUrl: string = '';
  export let apiKey: string = '';

  // ============================================================================
  // Props Mode - traditional props-based usage (e.g., from Angular)
  // ============================================================================
  export let parameters: ParamMeta[] = [];
  
  // ============================================================================
  // Internal state for self-fetch mode
  // ============================================================================
  let loading = false;
  let error: string | null = null;
  
  // Internal state
  let formValues: { [id: string]: any } = {};
  let touched: { [id: string]: boolean } = {};
  let errors: { [id: string]: string[] } = {};
  let isValid = true;
  let hostElement: HTMLElement | null = null;
  let container: HTMLDivElement;

  const dispatch = createEventDispatcher();

  // Get host element reference on mount
  onMount(async () => {
    await tick();
    // Get the host element (the custom element itself)
    hostElement = container?.getRootNode() instanceof ShadowRoot 
      ? (container.getRootNode() as ShadowRoot).host as HTMLElement
      : container?.closest('rb-parameters');
    
    // ========================================================================
    // Hybrid Mode: if reportCode provided, self-fetch config
    // ========================================================================
    if (reportCode && apiBaseUrl) {
      loading = true;
      error = null;
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      
      try {
        // Fetch config
        const configRes = await fetch(`${apiBaseUrl}/reports/${reportCode}/config`, { headers });
        if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
        const config = await configRes.json();
        
        // Apply parameters from config
        if (config.parameters && Array.isArray(config.parameters)) {
          parameters = config.parameters;
        }
        
      } catch (err: any) {
        error = err.message || 'Failed to load parameters';
        console.error('rb-parameters self-fetch error:', err);
        dispatch('fetchError', { message: error });
      }
      loading = false;
    }
  });

  // Initialize form values from parameters
  $: if (parameters && parameters.length) {
    initForm();
  }

  function initForm() {
    formValues = {};
    touched = {};
    errors = {};
    
    parameters.forEach(p => {
      formValues[p.id] = p.defaultValue ?? getDefaultForType(p.type);
      touched[p.id] = false;
      errors[p.id] = [];
    });
    
    validateAll();
    emitValues();
  }

  function getDefaultForType(type: string): any {
    const t = type.toLowerCase();
    if (t === 'boolean') return false;
    if (t === 'integer' || t === 'decimal') return null;
    return '';
  }

  // Type checking for references
  function isRef(x: any): x is ParamRef {
    return x && typeof x === 'object' && 'name' in x;
  }

  // Get control type from parameter
  function getControlType(p: ParamMeta): string {
    return (p.uiHints?.control || p.type || 'text').toLowerCase();
  }

  // Resolve min constraint (non-ref only for HTML attributes)
  function resolveMin(p: ParamMeta): string | null {
    const v = p.constraints?.min;
    if (!v || isRef(v)) return null;
    return String(v);
  }

  // Resolve max constraint (non-ref only for HTML attributes)
  function resolveMax(p: ParamMeta): string | null {
    const v = p.constraints?.max;
    if (!v || isRef(v)) return null;
    return String(v);
  }

  // Get actual value of a constraint (resolving refs)
  function getConstraintValue(p: ParamMeta, kind: 'min' | 'max'): any {
    const v = p.constraints?.[kind];
    if (isRef(v)) {
      return formValues[(v as ParamRef).name];
    }
    return v;
  }

  // Load select options
  function loadOptions(p: ParamMeta): { label: string; value: any }[] {
    const opts = p.uiHints?.options;
    if (!opts) return [];
    if (Array.isArray(opts)) {
      return opts.map(o => {
        if (typeof o === 'object' && 'label' in o && 'value' in o) {
          return o;
        }
        return { label: String(o), value: o };
      });
    }
    return [];
  }

  // Validate a single parameter
  function validateParam(p: ParamMeta): string[] {
    const errs: string[] = [];
    const value = formValues[p.id];
    const cons = p.constraints || {};

    // Required validation
    if (cons.required && (value === null || value === undefined || value === '')) {
      errs.push(`${p.label || p.id} is required.`);
    }

    // Min validation
    if (cons.min != null) {
      const minVal = getConstraintValue(p, 'min');
      if (minVal != null && value != null && value !== '') {
        const type = p.type.toLowerCase();
        if (type.startsWith('localdate') || type === 'date' || type === 'datetime') {
          if (new Date(value) < new Date(minVal)) {
            errs.push(`Minimum: ${minVal}`);
          }
        } else {
          if (Number(value) < Number(minVal)) {
            errs.push(`Minimum: ${minVal}`);
          }
        }
      }
    }

    // Max validation
    if (cons.max != null) {
      const maxVal = getConstraintValue(p, 'max');
      if (maxVal != null && value != null && value !== '') {
        const type = p.type.toLowerCase();
        if (type.startsWith('localdate') || type === 'date' || type === 'datetime') {
          if (new Date(value) > new Date(maxVal)) {
            errs.push(`Maximum: ${maxVal}`);
          }
        } else {
          if (Number(value) > Number(maxVal)) {
            errs.push(`Maximum: ${maxVal}`);
          }
        }
      }
    }

    // Pattern validation
    if (cons.pattern && value) {
      const regex = new RegExp(cons.pattern);
      if (!regex.test(String(value))) {
        errs.push(`Pattern: ${cons.pattern}`);
      }
    }

    return errs;
  }

  // Validate all parameters
  function validateAll() {
    let allValid = true;
    parameters.forEach(p => {
      errors[p.id] = validateParam(p);
      if (errors[p.id].length > 0) {
        allValid = false;
      }
    });
    
    if (isValid !== allValid) {
      isValid = allValid;
      dispatch('validChange', isValid);
      // Emit as CustomEvent for Angular/vanilla JS consumers
      emitHostEvent('validChange', isValid);
    }
  }

  // Handle input change
  function handleChange(p: ParamMeta, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    let value: any;

    const controlType = getControlType(p);
    if (controlType === 'boolean') {
      value = (target as HTMLInputElement).checked;
    } else if (controlType === 'integer') {
      value = target.value ? parseInt(target.value, 10) : null;
    } else if (controlType === 'decimal') {
      value = target.value ? parseFloat(target.value) : null;
    } else {
      value = target.value;
    }

    formValues[p.id] = value;
    touched[p.id] = true;
    
    // Re-validate this param and any that reference it
    validateAll();
    emitValues();
  }

  // Handle blur for touched state
  function handleBlur(p: ParamMeta) {
    touched[p.id] = true;
  }

  // Emit current values
  function emitValues() {
    const values = { ...formValues };
    dispatch('valueChange', values);
    // Emit as CustomEvent for Angular/vanilla JS consumers
    emitHostEvent('valueChange', values);
  }

  // Dispatch custom event on the host element (for Angular, vanilla JS, etc.)
  function emitHostEvent(name: string, detail: any) {
    if (!hostElement) {
      // Fallback: try to find host via container
      hostElement = container?.getRootNode() instanceof ShadowRoot 
        ? (container.getRootNode() as ShadowRoot).host as HTMLElement
        : container?.closest('rb-parameters');
    }
    
    if (hostElement) {
      const event = new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true
      });
      hostElement.dispatchEvent(event);
    }
  }

  // Get current form values (for programmatic access)
  export function getValues(): { [id: string]: any } {
    return { ...formValues };
  }

  // Check if form is valid
  export function isFormValid(): boolean {
    return isValid;
  }

  // Reset form to defaults
  export function reset() {
    initForm();
  }
</script>

{#if loading}
  <div class="rb-loading">Loading parameters...</div>
{:else if error}
  <div class="rb-error">{error}</div>
{:else}
  <div bind:this={container} id="formReportParameters" class="rb-parameters-form">
    {#if parameters && parameters.length}
      <form class="report-parameters-form" style="display: flex; flex-direction: column; gap: 1rem;">
        {#each parameters as p (p.id)}
          <div class="form-group">
            <label for={p.id}>{p.label || p.id}</label>

            {#if getControlType(p) === 'date'}
              <input
                type="date"
                id={p.id}
                value={formValues[p.id] || ''}
                min={resolveMin(p)}
                max={resolveMax(p)}
                title={p.description || p.label || p.id}
                class="form-control"
                on:input={(e) => handleChange(p, e)}
                on:blur={() => handleBlur(p)}
              />
            {:else if getControlType(p) === 'datetime'}
              <input
                type="datetime-local"
                id={p.id}
                value={formValues[p.id] || ''}
                min={resolveMin(p)}
                max={resolveMax(p)}
                title={p.description || ''}
                class="form-control"
                on:input={(e) => handleChange(p, e)}
                on:blur={() => handleBlur(p)}
            />
          {:else if getControlType(p) === 'integer'}
            <input
              type="number"
              id={p.id}
              value={formValues[p.id] ?? ''}
              step="1"
              min={resolveMin(p)}
              max={resolveMax(p)}
              title={p.description || ''}
              class="form-control"
              on:input={(e) => handleChange(p, e)}
              on:blur={() => handleBlur(p)}
            />
          {:else if getControlType(p) === 'decimal'}
            <input
              type="number"
              id={p.id}
              value={formValues[p.id] ?? ''}
              step="any"
              min={resolveMin(p)}
              max={resolveMax(p)}
              title={p.description || ''}
              class="form-control"
              on:input={(e) => handleChange(p, e)}
              on:blur={() => handleBlur(p)}
            />
          {:else if getControlType(p) === 'boolean'}
            <input
              type="checkbox"
              id={p.id}
              checked={formValues[p.id] || false}
              title={p.description || ''}
              on:change={(e) => handleChange(p, e)}
            />
          {:else if getControlType(p) === 'select'}
            <select
              id={p.id}
              value={formValues[p.id]}
              title={p.description || ''}
              class="form-control"
              on:change={(e) => handleChange(p, e)}
              on:blur={() => handleBlur(p)}
            >
              {#each loadOptions(p) as o}
                <option value={o.value}>{o.label}</option>
              {/each}
            </select>
          {:else}
            <input
              type="text"
              id={p.id}
              value={formValues[p.id] || ''}
              title={p.description || ''}
              class="form-control"
              on:input={(e) => handleChange(p, e)}
              on:blur={() => handleBlur(p)}
            />
          {/if}

          {#if touched[p.id] && errors[p.id]?.length > 0}
            <div class="text-danger validation-errors">
              {#each errors[p.id] as err}
                <div>{err}</div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </form>
  {/if}
  </div>
{/if}

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
  
  .rb-parameters-form {
    font-family: inherit;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  label {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .form-control {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  .form-control:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  .text-danger {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
  }
</style>
