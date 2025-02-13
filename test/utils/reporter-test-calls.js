// Import necessary modules from TestCafe
var TestRunErrorFormattableAdapter = require('testcafe').embeddingUtils.TestRunErrorFormattableAdapter;
var UncaughtErrorOnPage = require('testcafe').embeddingUtils.testRunErrors.UncaughtErrorOnPage;
var ActionElementNotFoundError = require('testcafe').embeddingUtils.testRunErrors.ActionElementNotFoundError;
var testCallsite = require('./test-callsite');

// Function to create error objects
function makeErrors(errDescrs) {
    return errDescrs.map(function (descr) {
        return new TestRunErrorFormattableAdapter(descr.err, descr.metaInfo);
    });
}

// Export an array of reporter test calls
module.exports = [
    {
        method: 'reportTaskStart',
        args: [
            new Date('1970-01-01T00:00:00.000Z'), // Start time
            [
                'Chrome 41.0.2227 / Mac OS X 10.10.1',
                'Firefox 47 / Mac OS X 10.10.1'
            ], // Browsers
            6 // Test count
        ]
    },
    {
        method: 'reportFixtureStart',
        args: [
            'First fixture', // Fixture name
            './fixture1.js' // Fixture path
        ]
    },
    {
        method: 'reportTestDone',
        args: [
            'First test in first fixture', // Test name
            {
                errs: [], // Errors
                durationMs: 74000, // Duration
                unstable: true, // Unstable flag
                screenshotPath: '/screenshots/1445437598847' // Screenshot path
            }
        ]
    },
    {
        method: 'reportTestDone',
        args: [
            'Second test in first fixture', // Test name
            {
                errs: makeErrors([
                    {
                        err: new UncaughtErrorOnPage('Some error', 'http://example.org'), // Error
                        metaInfo: {
                            userAgent: 'Chrome 41.0.2227 / Mac OS X 10.10.1', // User agent
                            screenshotPath: '/screenshots/1445437598847/errors', // Screenshot path
                            callsite: testCallsite, // Callsite
                            testRunState: 'inTest' // Test run state
                        }
                    },
                    {
                        err: new ActionElementNotFoundError(), // Error
                        metaInfo: {
                            userAgent: 'Firefox 47 / Mac OS X 10.10.1', // User agent
                            callsite: testCallsite, // Callsite
                            testRunState: 'inTest' // Test run state
                        }
                    }
                ]),
                durationMs: 74000, // Duration
                unstable: false, // Unstable flag
                screenshotPath: '/screenshots/1445437598847' // Screenshot path
            }
        ]
    },
    {
        method: 'reportTestDone',
        args: [
            'Third test in first fixture', // Test name
            {
                errs: [], // Errors
                durationMs: 74000, // Duration
                unstable: false, // Unstable flag
                screenshotPath: null // Screenshot path
            }
        ]
    },
    {
        method: 'reportFixtureStart',
        args: [
            'Second fixture', // Fixture name
            './fixture2.js' // Fixture path
        ]
    },
    {
        method: 'reportTestDone',
        args: [
            'First test in second fixture', // Test name
            {
                errs: [], // Errors
                durationMs: 74000, // Duration
                unstable: false, // Unstable flag
                screenshotPath: null // Screenshot path
            }
        ]
    },
    {
        method: 'reportTestDone',
        args: [
            'Second test in second fixture', // Test name
            {
                errs: [], // Errors
                durationMs: 74000, // Duration
                unstable: false, // Unstable flag
                screenshotPath: null // Screenshot path
            }
        ]
    },
    {
        method: 'reportTestDone',
        args: [
            'Third test in second fixture', // Test name
            {
                errs: [], // Errors
                durationMs: 0, // Duration
                unstable: false, // Unstable flag
                screenshotPath: null, // Screenshot path
                skipped: false // Skipped flag
            }
        ]
    },
    {
        method: 'reportFixtureStart',
        args: [
            'Third fixture', // Fixture name
            './fixture3.js' // Fixture path
        ]
    },
    {
        method: 'reportTestDone',
        args: [
            'First test in third fixture', // Test name
            {
                errs: makeErrors([
                    {
                        err: new ActionElementNotFoundError(), // Error
                        metaInfo: {
                            userAgent: 'Firefox 47 / Mac OS X 10.10.1', // User agent
                            callsite: testCallsite, // Callsite
                            testRunState: 'inBeforeEach' // Test run state
                        }
                    }
                ]),
                durationMs: 74000, // Duration
                unstable: true, // Unstable flag
                screenshotPath: null // Screenshot path
            }
        ]
    },
    {
        method: 'reportTaskDone',
        args: [
            new Date('1970-01-01T00:15:25.000Z'), // End time
            4, // Passed tests count
            [
                'Was unable to take a screenshot due to an error.\n\nReferenceError: someVar is not defined',
                'Was unable to take a screenshot due to an error.\n\nReferenceError: someOtherVar is not defined',
                'Was unable to take screenshots because the screenshot directory is not specified. ' +
                'To specify it, use the "-s" or "--screenshots" command line option or the ' +
                '"screenshots" method of the test runner in case you are using API.'
            ] // Warnings
        ]
    }
];
