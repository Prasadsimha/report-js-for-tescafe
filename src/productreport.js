require("dotenv").config();
const fs = require("fs");
const stripAnsi = require("strip-ansi");
const RPClient = require("reportportal-js-client");
import { isUndefined } from "util";

const baseUrl = `${process.env.REPORT_PORTAL_BASE_URL}/api/v1`;

export default class ProductReport {
  constructor() {
    this.projectName = process.env.REPORT_PORTAL_PROJECT_NAME;
    this.launchName = process.env.REPORT_PORTAL_LAUNCH_NAME || this.projectName;
    this.description = process.env.REPORT_PORTAL_DESCRIPTION || undefined;
    this.tagsList = process.env.REPORT_PORTAL_TAGS?.split(",") || undefined;
    this.fixtureList = [];
    this.connected = true;

    // Initialize ReportPortal client
    this.rpClient = new RPClient({
      token: process.env.REPORT_PORTAL_TOKEN,
      endpoint: baseUrl,
      launch: this.launchName,
      project: this.projectName,
    });

    // Check connection to ReportPortal
    this.rpClient.checkConnect().then(
      (response) => {
        this.connected = true;
      },
      (error) => {
        console.warn(
          "Error connecting to ReportPortal, confirm that your details are correct."
        );
        console.dir(error);
        this.connected = false;
      }
    );
  }

  // Start a new launch
  startLaunch() {
    if (!this.connected) return "Unknown Launch ID";
    const launchObj = this.rpClient.startLaunch({
      name: this.launchName,
      description: this.description,
      tags: this.tagsList,
    });

    return launchObj.tempId;
  }

  // Capture a fixture item
  captureFixtureItem(launchId, fixtureName) {
    if (!this.connected) return "Unknown Test ID";
    const suiteObj = this.rpClient.startTestItem(
      {
        name: fixtureName,
        type: "SUITE",
      },
      launchId
    );

    this.fixtureList.push(suiteObj.tempId);
    return suiteObj.tempId;
  }

  // Start a test item
  startTestItem(launchId, fixtureId, stepName) {
    if (!this.connected) return;

    const start_time = this.rpClient.helpers.now();
    const stepObj = this.rpClient.startTestItem(
      {
        name: stepName,
        start_time: start_time,
        type: "STEP",
      },
      launchId,
      fixtureId
    );

    return stepObj;
  }

  // Normalize browser string
  normalizeBrowserString(inputString) {
    return inputString.replace(/ /g, "spc").replace(/\./g, "dot").replace(/\//g, "slh");
  }

  // Capture a test item
  captureTestItem(
    stepInfo,
    launchId,
    fixtureId,
    stepName,
    status,
    testRunInfo,
    parentSelf
  ) {
    if (!this.connected) return;

    const hasErr = !!testRunInfo.errs.length;
    let start_time = this.rpClient.helpers.now();

    if (Object.keys(stepInfo).length > 0) {
      const browserArr = Object.keys(stepInfo);
      start_time = stepInfo[browserArr[0]][0].time;
    }

    if (hasErr) {
      testRunInfo.errs.forEach((error) => {
        const browser = error.userAgent;
        const checkBrowser = browser.includes("(")
          ? this.normalizeBrowserString(error.userAgent).split("spc(")[0]
          : this.normalizeBrowserString(error.userAgent);

        const err_time =
          stepInfo[checkBrowser][stepInfo[checkBrowser].length - 1].time + 1 || this.rpClient.helpers.now();
        const errMessage = error.errMsg || this.getErrorMessage(error);

        stepInfo[checkBrowser].push({
          browser: error.userAgent,
          index: "END.",
          time: err_time,
          message: errMessage,
          status: "error",
          screenshotPath: error.screenshotPath,
          duration: 0,
        });
      });
    }

    const stepObj = this.rpClient.startTestItem(
      {
        name: stepName,
        start_time: start_time,
        type: "STEP",
      },
      launchId,
      fixtureId
    );

    Object.keys(stepInfo).forEach((browserString) => {
      const stepColl = stepInfo[browserString];
      const cleanedString = browserString.replace(/spc/g, " ").replace(/dot/g, ".").replace(/slh/g, "/");

      this.rpClient.sendLog(stepObj.tempId, {
        status: "info",
        message: `Starting execution on Browser ${cleanedString}`,
        time: start_time,
      });

      stepColl.forEach((step) => {
        if (step.status === "error") status = "failed";

        const formattedMessage = step.message
          .replace(/:break:/g, "</br>")
          .replace(/:head:/g, "<b><u>")
          .replace(/:headend:/g, "</u></b>");

        if (step.screenshotPath) {
          const stepContent = fs.readFileSync(step.screenshotPath);
          this.rpClient.sendLog(
            stepObj.tempId,
            {
              status: step.status,
              message: `${step.index}${formattedMessage}`,
              time: step.time,
            },
            {
              name: `Screenshot.png`,
              type: "image/png",
              content: stepContent,
            }
          );
        } else {
          this.rpClient.sendLog(stepObj.tempId, {
            status: step.status,
            message: `${step.index}${step.message}`,
            time: step.time,
          });
        }
      });
    });

    const testResult = {
      status: status,
      end_time: start_time + testRunInfo.durationMs,
    };

    if (status === "skipped") testResult.issue = { issue_type: "NOT_ISSUE" };

    this.rpClient.finishTestItem(stepObj.tempId, testResult);
  }

  // Get error message
  getErrorMessage(error) {
    if (!isUndefined(error.apiFnChain)) {
      return `[ERROR]: The specified selector does not match any element in the DOM tree.  >> ${error.apiFnChain[0]}`;
    } else if (!isUndefined(error.argumentName)) {
      return `[ERROR]: The ${error.argumentName} argument is expected to be a non-empty string, but it was ${error.actualValue}`;
    } else {
      return `[ERROR]: ${error}`;
    }
  }

  // Finish all fixtures
  async finishFixture() {
    if (!this.connected) return;
    for (const fixtureId of this.fixtureList) {
      await this.rpClient.finishTestItem(fixtureId, {
        end_time: this.rpClient.helpers.now(),
      });
    }
  }

  // Finish the launch
  async finishLaunch(launchId) {
    if (!this.connected) return;
    await this.finishFixture();
    await this.rpClient.finishLaunch(launchId, {
      end_time: this.rpClient.helpers.now(),
    });
  }
}