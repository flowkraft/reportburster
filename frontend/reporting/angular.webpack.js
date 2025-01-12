//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
// const BundleAnalyzerPlugin =
//   require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
  config.target = "electron-renderer";

  if (!options.optimization || process.env.NODE_ENV === "development") {
    config.mode = "development";
    config.devtool = "eval";
  }

  if (options.fileReplacements) {
    for (let fileReplacement of options.fileReplacements) {
      if (fileReplacement.replace !== "src/environments/environment.ts") {
        continue;
      }

      let fileReplacementParts = fileReplacement["with"].split(".");
      if (
        fileReplacementParts.length > 1 &&
        ["web"].indexOf(fileReplacementParts[1]) >= 0
      ) {
        config.target = "web";
      }
      break;
    }
  }

  config.plugins = [
    ...config.plugins,
    new NodePolyfillPlugin({
      excludeAliases: ["console"],
    }),
  ];

  // Commented out BundleAnalyzerPlugin for now
  // if (!options.optimization) {
  //     config.plugins.push(new BundleAnalyzerPlugin());
  // }

  // Verify source map configuration
  if (process.env.DEBUG === "true") {
    console.log("Build configuration:", {
      optimization: options.optimization,
      environment: process.env.NODE_ENV,
      configurationName: options.configuration,
    });
    console.log("Source map verification:", {
      angularSourceMap: options.sourceMap,
      webpackDevtool: config.devtool,
      mode: config.mode,
      target: config.target,
    });

    // Log all webpack rules to verify source map handling
    console.log("Webpack rules:", config.module.rules);
  }

  return config;
};
