import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { transform } from "esbuild";
import { terser } from "rollup-plugin-terser";

// Compute __dirname for ES Modules:
const __dirname = dirname(fileURLToPath(import.meta.url));

// Optional custom minification plugin using esbuild
function minifyEs() {
  return {
    name: "minifyEs",
    renderChunk: {
      order: "post" as const,
      async handler(
        code: string | Uint8Array,
        chunk: any,
        outputOptions: { format: string }
      ) {
        if (outputOptions.format === "es") {
          const result = await transform(code, { minify: true });
          return result.code;
        }
        return code;
      },
    },
  };
}

export default defineConfig(({ command }) => {
  if (command === "build") {
    return {
      plugins: [
        // Process normal Svelte files (exclude .wc.svelte files)
        svelte({
          exclude: "**/*.wc.svelte",
        }),
        // Process web component files (only include .wc.svelte files) and compile them as custom elements
        svelte({
          include: "**/*.wc.svelte",
          compilerOptions: {
            customElement: true,
          },
        }),
        minifyEs(), // extra minification plugin using esbuild
        terser({
          compress: {
            pure_getters: true,
            unsafe: true,
            passes: 10,
          },
          mangle: true,
        }),
      ],
      build: {
        lib: {
          // Use the web component registration file as the library entry point
          entry: resolve(__dirname, "src/wc/web-components.ts"),
          name: "RbWebComponents",
          fileName: (format) => `rb-webcomponents.${format}.js`,
          // Build both ES and UMD formats
          formats: ["es", "umd"],
        },
        rollupOptions: {
          // Remove 'svelte' from the externals so it's bundled in
          external: [],
          output: {
            // no need to declare globals if nothing is external
          },
        },
        // Disable sourcemaps for production
        sourcemap: false,
        outDir: "dist",
      },
    };
  }

  // Development (dev server) configuration:
  return {
    plugins: [
      svelte({
        exclude: "**/*.wc.svelte",
      }),
      svelte({
        include: "**/*.wc.svelte",
        compilerOptions: {
          customElement: true,
        },
      }),
    ],
  };
});
