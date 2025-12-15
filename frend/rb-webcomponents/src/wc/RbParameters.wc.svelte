<svelte:options customElement="rb-parameters" accessors={true} />

<script lang="ts">
  console.log('[rb-parameters] ====== COMPONENT SCRIPT LOADED ======');
  
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
  
  // Raw DSL source code (exposed for Configuration tab)
  export let configDsl: string = '';
  
  // Internal state
  let formValues: { [id: string]: any } = {};
  let touched: { [id: string]: boolean } = {};
  let errors: { [id: string]: string[] } = {};
  let isValid = true;
  let hostElement: HTMLElement | null = null;
  let container: HTMLDivElement;
  let isMounted = false;
  let pendingValidEmit: boolean | null = null;
  let pendingValuesEmit: { [id: string]: any } | null = null;

  const dispatch = createEventDispatcher();

  // Get host element reference on mount
  onMount(async () => {
    console.log('[rb-parameters] onMount START, reportCode:', reportCode, 'apiBaseUrl:', apiBaseUrl);
    await tick();
    // Get the host element (the custom element itself)
    hostElement = container?.getRootNode() instanceof ShadowRoot 
      ? (container.getRootNode() as ShadowRoot).host as HTMLElement
      : container?.closest('rb-parameters');
    
    console.log('[rb-parameters] onMount after tick, hostElement:', hostElement ? 'found' : 'null');
    
    // Read attributes directly from host element (Svelte props may not be populated yet for kebab-case attributes)
    if (hostElement) {
      if (!reportCode) reportCode = hostElement.getAttribute('report-code') || '';
      if (!apiBaseUrl) apiBaseUrl = hostElement.getAttribute('api-base-url') || '';
      if (!apiKey) apiKey = hostElement.getAttribute('api-key') || '';
      console.log('[rb-parameters] After reading host attributes - reportCode:', reportCode, 'apiBaseUrl:', apiBaseUrl);
    }
    
    isMounted = true;
    
    // Emit any pending events that were queued before mount
    if (pendingValidEmit !== null) {
      console.log('[rb-parameters] onMount: emitting PENDING validChange:', pendingValidEmit);
      emitHostEvent('validChange', pendingValidEmit);
      pendingValidEmit = null;
    }
    if (pendingValuesEmit !== null) {
      console.log('[rb-parameters] onMount: emitting PENDING valueChange');
      emitHostEvent('valueChange', pendingValuesEmit);
      pendingValuesEmit = null;
    }
    
    // ========================================================================
    // Hybrid Mode: if reportCode provided, self-fetch config
    // ========================================================================
    if (reportCode && apiBaseUrl) {
      console.log('[rb-parameters] Self-fetch mode: fetching config for', reportCode);
      loading = true;
      error = null;
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey) headers['X-API-Key'] = apiKey;
      
      const configUrl = `${apiBaseUrl}/reports/${reportCode}/config`;
      console.log('[rb-parameters] Fetching config from:', configUrl);
      
      try {
        // Fetch config
        const configRes = await fetch(configUrl, { headers });
        console.log('[rb-parameters] Config response status:', configRes.status);
        if (!configRes.ok) throw new Error(`Config fetch failed: ${configRes.status}`);
        const config = await configRes.json();
        
        console.log('[rb-parameters] Config received:', {
          hasParameters: config.hasParameters,
          parametersCount: config.parameters?.length || 0,
          parametersDsl: config.parametersDsl ? `${config.parametersDsl.length} chars` : 'MISSING',
          parameters: config.parameters
        });
        
        // Apply parameters from config
        if (config.parameters && Array.isArray(config.parameters)) {
          parameters = config.parameters;
          console.log('[rb-parameters] Parameters applied:', parameters.length, 'params');
        } else {
          console.warn('[rb-parameters] No parameters array in config!');
        }
        
        // Store raw DSL for Configuration tab display
        if (config.parametersDsl) {
          configDsl = config.parametersDsl;
          console.log('[rb-parameters] configDsl set, length:', configDsl.length);
        } else {
          console.warn('[rb-parameters] No parametersDsl in config!');
        }
        
        // Dispatch events for config loaded (both names for compatibility)
        console.log('[rb-parameters] Dispatching configLoaded and configFetched events');
        dispatch('configLoaded', { configDsl, config });
        dispatch('configFetched', { parameters }); // Legacy event name
        
      } catch (err: any) {
        error = err.message || 'Failed to load parameters';
        console.error('[rb-parameters] self-fetch error:', err);
        dispatch('fetchError', { message: error });
      }
      loading = false;
      console.log('[rb-parameters] Self-fetch complete, loading:', loading, 'error:', error);
    } else {
      console.log('[rb-parameters] Props mode (no self-fetch), parameters:', parameters?.length || 0);
    }
  });

  // Initialize form values from parameters
  $: if (parameters && parameters.length) {
    console.log('[rb-parameters] reactive $: parameters changed, count:', parameters.length, 'isMounted:', isMounted);
    console.log('[rb-parameters] parameters details:', JSON.stringify(parameters, null, 2));
    initForm();
  }

  function initForm() {
    console.log('[rb-parameters] initForm START, params count:', parameters?.length);
    formValues = {};
    touched = {};
    errors = {};
    
    parameters.forEach(p => {
      formValues[p.id] = p.defaultValue ?? getDefaultForType(p.type);
      touched[p.id] = false;
      errors[p.id] = [];
    });
    
    validateAll(true); // Force emit on init
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
  function validateAll(forceEmit: boolean = false) {
    // console.log('[RbParameters] validateAll START, forceEmit:', forceEmit, 'isMounted:', isMounted);
    let allValid = true;
    parameters.forEach(p => {
      errors[p.id] = validateParam(p);
      if (errors[p.id].length > 0) {
        allValid = false;
      }
    });
    
    // console.log('[RbParameters] validateAll: allValid:', allValid, 'isValid:', isValid, 'will emit:', forceEmit || isValid !== allValid);
    
    if (forceEmit || isValid !== allValid) {
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
    // console.log('[RbParameters] emitHostEvent called:', name, 'detail:', detail, 'isMounted:', isMounted, 'hostElement:', hostElement);
    
    // If not mounted yet, queue the event for later
    if (!isMounted) {
      // console.log('[RbParameters] emitHostEvent: NOT MOUNTED, queuing event:', name);
      if (name === 'validChange') {
        pendingValidEmit = detail;
      } else if (name === 'valueChange') {
        pendingValuesEmit = detail;
      }
      return;
    }
    
    if (!hostElement) {
      // Fallback: try to find host via container
      hostElement = container?.getRootNode() instanceof ShadowRoot 
        ? (container.getRootNode() as ShadowRoot).host as HTMLElement
        : container?.closest('rb-parameters');
      // console.log('[RbParameters] emitHostEvent: fallback hostElement lookup:', hostElement);
    }
    
    if (hostElement) {
      const event = new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true
      });
      // console.log('[RbParameters] emitHostEvent: DISPATCHING CustomEvent:', name, 'on host:', hostElement.tagName);
      hostElement.dispatchEvent(event);
    } else {
      console.warn('[RbParameters] emitHostEvent: NO HOST ELEMENT, event lost:', name);
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

  // Public method to re-fetch config (for Refresh button)
  export async function fetchConfig() {
    if (!reportCode || !apiBaseUrl) {
      console.warn('rb-parameters: fetchConfig requires reportCode and apiBaseUrl');
      return;
    }
    
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
      
      // Update raw DSL for Configuration tab
      if (config.parametersDsl) {
        configDsl = config.parametersDsl;
      }
      
      dispatch('configFetched', { parameters });
    } catch (err: any) {
      error = err.message || 'Failed to load parameters';
      console.error('rb-parameters fetchConfig error:', err);
      dispatch('fetchError', { message: error });
    }
    loading = false;
  }
</script>

{#if loading}
  <div class="rb-loading">Loading parameters...</div>
{:else if error}
  <div class="rb-error">{error}</div>
{:else}
  <div bind:this={container} id="formReportParameters" class="rb-parameters-form">
    {#if parameters && parameters.length}
      <!-- Debug: rendering {parameters.length} parameters -->
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
  {:else}
    <div class="rb-no-params" style="padding: 1rem; color: #666; text-align: center;">
      No parameters defined. Check console for debug info.
    </div>
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
