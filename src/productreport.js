require('dotenv').config();
const fs = require('fs');
const stripAnsi = require('strip-ansi');
const RPClient = require('reportportal-js-client');

const baseUrl = process.env.REPORT_PORTAL_BASE_URL + '/api/v1';

export default class ProductReport {

    constructor() {
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

        this.rpClient.checkConnect().then((response) => {
            this.connected = true;
            // console.log('You have successfully connected to the server.');
            // console.log(`You are using an account: ${response.full_name}`);
        }, (error) => {
            console.warn('Error connecting to ReportPortal, confirm that your details are correct.');
            console.dir(error);
            this.connected = false;
        });
    }

    startLaunch() {
        if (!this.connected) return 'Unknown Launch ID';
        const launchObj = this.rpClient.startLaunch({
            name: this.launchName,
            description: this.description,
            tags: this.tagsList
        });

        return launchObj.tempId;
    }

    captureFixtureItem(launchId, fixtureName) {
        if (!this.connected) return 'Unknown Test ID';
        const suiteObj = this.rpClient.startTestItem({
            name: fixtureName,
            type: 'SUITE'
        }, launchId);

        this.fixtureList.push(suiteObj.tempId);
        return suiteObj.tempId;
    }

    startTestItem(launchId, fixtureId, stepName) {

        if (!this.connected) return;

        var start_time = this.rpClient.helpers.now();
        var stepObj = this.rpClient.startTestItem({
            name: stepName,
            start_time: start_time,
            type: 'STEP'
        }, launchId, fixtureId);

        return stepObj;
    }

    normalizeBrowserString(inputString) {
        var browserString = inputString.replace(/ /g, 'spc');
        browserString = browserString.replace(/\./g, 'dot');
        browserString = browserString.replace(/\//g, 'slh');
        return browserString;
    }

    captureTestItem(stepInfo, launchId, fixtureId, stepName, status, testRunInfo, parentSelf) {
        if (!this.connected) return;

        const hasErr = !!testRunInfo.errs.length;

        var start_time = this.rpClient.helpers.now();

        if (Object.keys(stepInfo).length > 0) {
            var browserArr = Object.keys(stepInfo);
            start_time = stepInfo[browserArr[0]][0].time;
        }

        if (hasErr) {
            testRunInfo.errs.forEach(error => {
                var checkBrowser = this.normalizeBrowserString(error.userAgent);
                var err_time=stepInfo[checkBrowser][stepInfo[checkBrowser].length-1].time + 1;
                stepInfo[checkBrowser].push(
                    {
                        'browser': error.userAgent,
                        'index': 'END.',
                        'time': err_time,
                        'message': error.errMsg,
                        'status': 'error',
                        'screenshotPath': error.screenshotPath,
                        'duration': 0
                    }
                );
            });
        }

        const stepObj = this.rpClient.startTestItem({
            name: stepName,
            start_time: start_time,
            type: 'STEP'
        }, launchId, fixtureId);

        Object.keys(stepInfo).forEach(browserString => {

            var stepColl = stepInfo[browserString];

            var cleanedString = browserString.replace(/spc/g, ' ');
            cleanedString = cleanedString.replace(/dot/g, '\.');
            cleanedString = cleanedString.replace(/slh/g, '\/');

            this.rpClient.sendLog(stepObj.tempId, {
                status: 'info',
                message: 'Starting execution on Browser ' + cleanedString,
                time: start_time
            });

            stepColl.forEach((step) => {

                if (step.status === 'error')
                    status = 'failed';
            
                var formattedMessage = step.message.replace(/:break:/g, '</br>');
                formattedMessage = formattedMessage.replace(/:head:/g, '<b><u>');
                formattedMessage = formattedMessage.replace(/:headend:/g, '</u></b>');

                if (step.screenshotPath !== '') {
                    const stepContent = fs.readFileSync(step.screenshotPath);
                    this.rpClient.sendLog(stepObj.tempId, {
                        status: step.status,
                        message: step.index + formattedMessage,
                        time: step.time
                    },
                        {
                            name: `Screenshot.png`,
                            type: 'image/png',
                            content: stepContent
                        });
                }
                else {
                    this.rpClient.sendLog(stepObj.tempId, {
                        status: step.status,
                        message: step.index + step.message,
                        time: step.time
                    });
                }

            });
        });

        var testResult = {
            status: status,
            end_time: start_time + testRunInfo.durationMs
        };

        if (status === 'skipped') testResult.issue = { issue_type: 'NOT_ISSUE' };

        this.rpClient.finishTestItem(stepObj.tempId, testResult);
    }


    async finishFixture() {
        if (!this.connected) return;
        this.fixtureList.forEach(async (fixtureId, idx) => {
            await this.rpClient.finishTestItem(fixtureId, {
                end_time: this.rpClient.helpers.now()
            });
        });
    }

    async finishLaunch(launchId) {
        if (!this.connected) return;
        await this.finishFixture();
        await this.rpClient.finishLaunch(launchId, {
            end_time: this.rpClient.helpers.now()
        });
    }

}
