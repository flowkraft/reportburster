//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
  config.target = "electron-renderer";

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
    //new webpack.DefinePlugin({
    //  process: "process/browser",
    //}),
    new NodePolyfillPlugin({
      excludeAliases: ["console"],
    }),
  ];

  //my own stuff
  //add BundleAnalyzerPlugin for non-production builds
  if (!options.optimization) {
    config.plugins.push(new BundleAnalyzerPlugin());
  }

  if (process.env.TARGET === "electron") {
    config.target = "electron-renderer";
  } else {
    config.target = "web";

    config.resolve = {
      ...config.resolve,
      fallback: { fs: false, child_process: false },
    };
  }

  console.log("config.target:", config.target);

  //config.externals = {
  //  ...config.externals,
  //};

  if (config.target === "electron-renderer") {
    config.externals.electron = 'require("electron")';
    console.log("Added electron to externals");
  }
  //end my own stuff

  return config;
};
