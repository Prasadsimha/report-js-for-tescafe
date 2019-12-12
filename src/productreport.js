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

    captureTestItem(stepInfo, launchId, fixtureId, stepName, status, testRunInfo, parentSelf) {
        if (!this.connected) return;

        var start_time = this.rpClient.helpers.now();
        var err_time = this.rpClient.helpers.now();
        if (stepInfo.length > 0) {
            start_time = stepInfo[0].time;
            err_time = stepInfo[stepInfo.length - 1].time + 3;
        }
        const stepObj = this.rpClient.startTestItem({
            name: stepName,
            start_time: start_time,
            type: 'STEP'
        }, launchId, fixtureId);

        stepInfo.forEach((step) => {

            if(step.status === 'error')
            {
                status = 'failed';
            }

            if (step.screenshotPath !== '') {
                const stepContent = fs.readFileSync(step.screenshotPath);
                this.rpClient.sendLog(stepObj.tempId, {
                    status: step.status,
                    message: step.index + step.message,
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

        if (testRunInfo.screenshots) {
            testRunInfo.screenshots.forEach((screenshot, idx) => {
                // console.log('screenshotPath -> ', screenshot.screenshotPath);

                if (!screenshot.screenshotPath.includes('Page_') && !screenshot.screenshotPath.includes('Control_')) {

                    const screenshotContent = fs.readFileSync(screenshot.screenshotPath);

                    this.rpClient.sendLog(stepObj.tempId,
                        {
                            status: 'error',
                            message: 'Error Screenshot',
                            time: err_time
                        },
                        {
                            name: `${stepName}.png`,
                            type: 'image/png',
                            content: screenshotContent
                        }
                    );
                }
            });
        }

        if (testRunInfo.errs) {
            testRunInfo.errs.forEach((err, idx) => {
                err = parentSelf.formatError(err);

                this.rpClient.sendLog(stepObj.tempId, {
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
