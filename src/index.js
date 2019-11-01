const ProductReport = require('./productreport');

export default function () {
    return {
        noColors: false,
        
        reportTaskStart (startTime, userAgents, testCount) {
            this.startTime = startTime;
            this.testCount = testCount;
        
            this.write(`Running tests in: ${userAgents}`)
                .newline();
                
            this.productReport = new ProductReport();
            this.launchId = this.productReport.startLaunch();
        },
        
        reportFixtureStart (name) {
            this.fixtureId = this.productReport.captureFixtureItem(this.launchId, name);

            this.newline()
                .setIndent(0)
                .write(`[${this.chalk.blue(name)}]`)
                .newline();
        },
        
        reportTestStart (name, meta) {
            this.stepObj = this.productReport.startTestItem(this.launchId, this.fixtureId, name);
            Promise.resolve(this.stepObj.promise).then(response => {
                var fs = require('fs');
                var rundata = {
                    'launchId':  this.launchId,
                    'fixtureId': this.fixtureId,
                    'testId':   response.id
                };
                fs.writeFileSync('currenttest.json', JSON.stringify(rundata));
                console.log('run file generated');
            });
        },
        
        reportTestDone (name, testRunInfo) {
            const self = this;
            const hasErr = !!testRunInfo.errs.length;
            const result = testRunInfo.skipped ? 'skipped' : hasErr ? 'failed' : 'passed';
        
            const title = `[ ${result === 'passed' ? this.chalk.green.bold('✓') : result === 'skipped' ? this.chalk.blue.bold('-') : this.chalk.red.bold('✖')} ] ${name}`;
        
            this.setIndent(2)
                .write(`${title}`)
                .newline();

            if (hasErr) {
                testRunInfo.errs.forEach((err, idx) => {
                    this.newline()
                        .write(this.formatError(err, `${idx + 1}) `))
                        .newline();
                });
            }

            this.productReport.captureTestItem(this.stepObj, this.launchId, this.fixtureId, name, result, testRunInfo, self);

            var fs = require('fs');
            fs.unlinkSync('currenttest.json');
            console.log('run file deleted');
        },
        
        async reportTaskDone (endTime, passed) {
            const durationMs  = endTime - this.startTime;
            const durationStr = this.moment
                                    .duration(durationMs)
                                    .format('h[h] mm[m] ss[s]');

            let footer = passed === this.testCount ?
                         `${this.testCount} passed` :
                         `${this.testCount - passed}/${this.testCount} failed`;
        
            footer += ` (Duration: ${durationStr})`;
        
            this.newline()
                .setIndent(0)
                .write(footer)
                .newline();

            await this.productReport.finishLaunch(this.launchId);
        }
    };
}
