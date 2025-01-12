//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
// const BundleAnalyzerPlugin =
//   require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
    config.target = 'electron-renderer';

    if (options.fileReplacements) {
        for(let fileReplacement of options.fileReplacements) {
            if (fileReplacement.replace !== 'src/environments/environment.ts') {
                continue;
            }

            let fileReplacementParts = fileReplacement['with'].split('.');
            if (fileReplacementParts.length > 1 && ['web'].indexOf(fileReplacementParts[1]) >= 0) {
                config.target = 'web';
            }
            break;
        }
    }

    config.plugins = [
        ...config.plugins,
        new NodePolyfillPlugin({
            excludeAliases: ["console"]
        })
    ];

    // Commented out BundleAnalyzerPlugin for now
    // if (!options.optimization) {
    //     config.plugins.push(new BundleAnalyzerPlugin());
    // }

    // Enable source maps for development
    if (!options.optimization) {
        config.devtool = 'source-map';
        console.log('Source maps enabled');
    }

    return config;
}
