<svelte:options customElement="my-component" />

<script lang="ts">
  export let name: string = 'World';
</script>

<style>
  p {
    color: blue;
    font-family: sans-serif;
    outline: solid 1px red;
  }
</style>

<p>Hello, {name}!</p>
