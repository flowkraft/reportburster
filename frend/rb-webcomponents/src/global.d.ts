declare module '*.svelte' {
  import { SvelteComponentTyped } from 'svelte';
  export default SvelteComponentTyped;
}

declare module "rollup-plugin-terser" {
  import { Plugin } from "rollup";
  export default function terser(options?: any): Plugin;
}