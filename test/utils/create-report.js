// Import necessary modules
const { embeddingUtils } = require('testcafe');
const pluginFactory = require('../../lib');
const reporterTestCalls = require('./reporter-test-calls');

// Function to create a report
module.exports = function createReport(withColors) {
    // Create an output stream object to capture the report data
    const outStream = {
        data: '',
        write(text) {
            this.data += text;
        }
    };

    // Build the reporter plugin using the factory and output stream
    const plugin = embeddingUtils.buildReporterPlugin(pluginFactory, outStream);

    // Enable or disable chalk based on the plugin settings and input parameter
    plugin.chalk.enabled = !plugin.noColors && withColors;
    plugin.symbols = { ok: '✓', err: '✖' };

    // Disable error coloring if no custom error decorator is provided
    if (plugin.chalk.enabled && !pluginFactory().createErrorDecorator) {
        const origFormatError = plugin.formatError;

        plugin.formatError = function () {
            plugin.chalk.enabled = false;
            const result = origFormatError.apply(plugin, arguments);
            plugin.chalk.enabled = true;
            return result;
        };
    }

    // Execute the reporter test calls
    reporterTestCalls.forEach(call => {
        plugin[call.method](...call.args);
    });

    // Mock stack entries in the output data
    return outStream.data.replace(/\s*?\(.+?:\d+:\d+\)/g, ' (some-file:1:1)');
};