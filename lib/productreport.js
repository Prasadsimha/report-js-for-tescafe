'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});
require('dotenv').config();
var fs = require('fs');
var stripAnsi = require('strip-ansi');
var RPClient = require('reportportal-js-client');

var baseUrl = process.env.REPORT_PORTAL_BASE_URL + '/api/v1';

var ProductReport = (function () {
    function ProductReport() {
        var _this = this;

        _classCallCheck(this, ProductReport);

        this.projectName = process.env.REPORT_PORTAL_PROJECT_NAME;
        this.launchName = process.env.REPORT_PORTAL_LAUNCH_NAME || this.projectName;
        this.description = typeof process.env.REPORT_PORTAL_DESCRIPTION === 'undefined' ? void 0 : process.env.REPORT_PORTAL_DESCRIPTION;
        this.tagsList = typeof process.env.REPORT_PORTAL_TAGS === 'undefined' ? void 0 : process.env.REPORT_PORTAL_TAGS.split(',');
        this.fixtureList = [];
        this.connected = true;

        this.rpClient = new RPClient({
            token: process.env.REPORT_PORTAL_TOKEN,
            endpoint: baseUrl,
            launch: this.launchName,
            project: this.projectName
        });

        this.rpClient.checkConnect().then(function (response) {
            _this.connected = true;
            // console.log('You have successfully connected to the server.');
            // console.log(`You are using an account: ${response.full_name}`);
        }, function (error) {
            console.warn('Error connecting to ReportPortal, confirm that your details are correct.');
            console.dir(error);
            _this.connected = false;
        });
    }

    _createClass(ProductReport, [{
        key: 'startLaunch',
        value: function startLaunch() {
            if (!this.connected) return 'Unknown Launch ID';
            var launchObj = this.rpClient.startLaunch({
                name: this.launchName,
                description: this.description,
                tags: this.tagsList
            });

            return launchObj.tempId;
        }
    }, {
        key: 'captureFixtureItem',
        value: function captureFixtureItem(launchId, fixtureName) {
            if (!this.connected) return 'Unknown Test ID';
            var suiteObj = this.rpClient.startTestItem({
                name: fixtureName,
                type: 'SUITE'
            }, launchId);

            this.fixtureList.push(suiteObj.tempId);
            return suiteObj.tempId;
        }
    }, {
        key: 'startTestItem',
        value: function startTestItem(launchId, fixtureId, stepName) {

            if (!this.connected) return;

            var start_time = this.rpClient.helpers.now();
            var stepObj = this.rpClient.startTestItem({
                name: stepName,
                start_time: start_time,
                type: 'STEP'
            }, launchId, fixtureId);

            return stepObj;
        }
    }, {
        key: 'captureTestItem',
        value: function captureTestItem(stepInfo, launchId, fixtureId, stepName, status, testRunInfo, parentSelf) {
            var _this2 = this;

            if (!this.connected) return;

            var start_time = this.rpClient.helpers.now();
            var err_time = this.rpClient.helpers.now();
            if (stepInfo.length > 0) {
                start_time = stepInfo[0].time;
                err_time = stepInfo[stepInfo.length - 1].time + 3;
            }
            var stepObj = this.rpClient.startTestItem({
                name: stepName,
                start_time: start_time,
                type: 'STEP'
            }, launchId, fixtureId);

            stepInfo.forEach(function (step) {

                if (step.status === 'error') status = 'failed';

                if (step.screenshotPath !== '') {
                    var stepContent = fs.readFileSync(step.screenshotPath);
                    _this2.rpClient.sendLog(stepObj.tempId, {
                        status: step.status,
                        message: step.index + step.message,
                        time: step.time
                    }, {
                        name: 'Screenshot.png',
                        type: 'image/png',
                        content: stepContent
                    });
                } else {
                    _this2.rpClient.sendLog(stepObj.tempId, {
                        status: step.status,
                        message: step.index + step.message,
                        time: step.time
                    });
                }
            });

            if (testRunInfo.screenshots) {
                testRunInfo.screenshots.forEach(function (screenshot, idx) {
                    // console.log('screenshotPath -> ', screenshot.screenshotPath);

                    if (!screenshot.screenshotPath.includes('Page_') && !screenshot.screenshotPath.includes('Control_')) {

                        var screenshotContent = fs.readFileSync(screenshot.screenshotPath);

                        _this2.rpClient.sendLog(stepObj.tempId, {
                            status: 'error',
                            message: 'Error Screenshot',
                            time: err_time
                        }, {
                            name: stepName + '.png',
                            type: 'image/png',
                            content: screenshotContent
                        });
                    }
                });
            }

            if (testRunInfo.errs) {
                testRunInfo.errs.forEach(function (err, idx) {
                    err = parentSelf.formatError(err);

                    _this2.rpClient.sendLog(stepObj.tempId, {
                        status: 'error',
                        message: stripAnsi(err),
                        time: err_time
                    });
                });
            }

            var testResult = {
                status: status,
                end_time: start_time + testRunInfo.durationMs
            };

            if (status === 'skipped') testResult.issue = { issue_type: 'NOT_ISSUE' };

            this.rpClient.finishTestItem(stepObj.tempId, testResult);
        }
    }, {
        key: 'finishFixture',
        value: function finishFixture() {
            return _regeneratorRuntime.async(function finishFixture$(context$2$0) {
                var _this3 = this;

                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (this.connected) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 2:
                        this.fixtureList.forEach(function callee$2$0(fixtureId, idx) {
                            return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
                                while (1) switch (context$3$0.prev = context$3$0.next) {
                                    case 0:
                                        context$3$0.next = 2;
                                        return _regeneratorRuntime.awrap(this.rpClient.finishTestItem(fixtureId, {
                                            end_time: this.rpClient.helpers.now()
                                        }));

                                    case 2:
                                    case 'end':
                                        return context$3$0.stop();
                                }
                            }, null, _this3);
                        });

                    case 3:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: 'finishLaunch',
        value: function finishLaunch(launchId) {
            return _regeneratorRuntime.async(function finishLaunch$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (this.connected) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.abrupt('return');

                    case 2:
                        context$2$0.next = 4;
                        return _regeneratorRuntime.awrap(this.finishFixture());

                    case 4:
                        context$2$0.next = 6;
                        return _regeneratorRuntime.awrap(this.rpClient.finishLaunch(launchId, {
                            end_time: this.rpClient.helpers.now()
                        }));

                    case 6:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }]);

    return ProductReport;
})();

exports['default'] = ProductReport;
module.exports = exports['default'];