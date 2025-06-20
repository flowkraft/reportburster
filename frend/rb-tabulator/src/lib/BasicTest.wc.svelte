<svelte:options customElement="basic-test" />

<script>
  // No TypeScript, no imports yet - just a simple test
  console.log("BasicTest component script executing");
  
  // Lifecycle
  import { onMount } from 'svelte';
  
  onMount(() => {
    console.log("BasicTest component mounted");
    return () => console.log("BasicTest component destroyed");
  });
</script>

<div style="border: 2px solid red; padding: 10px;">
  <h3>Basic Test Component</h3>
  <p>If you can see this, the web component is working!</p>
  <slot></slot>
</div>