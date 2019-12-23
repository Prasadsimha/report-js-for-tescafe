'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});
var ProductReport = require('./productreport');

exports['default'] = function () {
    return {
        noColors: false,

        reportTaskStart: function reportTaskStart(startTime, userAgents, testCount) {
            this.startTime = startTime;
            this.testCount = testCount;

            this.write('Running tests in: ' + userAgents).newline();

            this.productReport = new ProductReport();
            this.launchId = this.productReport.startLaunch();
        },

        reportFixtureStart: function reportFixtureStart(name) {
            this.fixtureId = this.productReport.captureFixtureItem(this.launchId, name);

            this.newline().setIndent(0).write('[' + this.chalk.blue(name) + ']').newline();
        },

        reportTestDone: function reportTestDone(name, testRunInfo, meta) {
            var _this = this;

            var self = this;
            var hasErr = !!testRunInfo.errs.length;
            var result = testRunInfo.skipped ? 'skipped' : hasErr ? 'failed' : 'passed';

            var title = '[ ' + (result === 'passed' ? this.chalk.green.bold('✓') : result === 'skipped' ? this.chalk.blue.bold('-') : this.chalk.red.bold('✖')) + ' ] ' + name;

            var stepInfo = meta['stepinfo'];

            this.setIndent(2).write('' + title).newline();

            if (hasErr) {
                testRunInfo.errs.forEach(function (err, idx) {
                    _this.newline().write(_this.formatError(err, idx + 1 + ') ')).newline();
                });
            }

            this.productReport.captureTestItem(stepInfo, this.launchId, this.fixtureId, name, result, testRunInfo, self);
        },

        reportTaskDone: function reportTaskDone(endTime, passed) {
            var durationMs, durationStr, footer;
            return _regeneratorRuntime.async(function reportTaskDone$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        durationMs = endTime - this.startTime;
                        durationStr = this.moment.duration(durationMs).format('h[h] mm[m] ss[s]');
                        footer = passed === this.testCount ? this.testCount + ' passed' : this.testCount - passed + '/' + this.testCount + ' failed';

                        footer += ' (Duration: ' + durationStr + ')';

                        this.newline().setIndent(0).write(footer).newline();

                        context$2$0.next = 7;
                        return _regeneratorRuntime.awrap(this.productReport.finishLaunch(this.launchId));

                    case 7:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    };
};

module.exports = exports['default'];