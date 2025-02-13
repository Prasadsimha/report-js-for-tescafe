# testcafe-reporter-reportportal

This is the Nott **reportportal** reporter plugin for Test Cafe Framework [TestCafe](http://devexpress.github.io/testcafe).

## Install
Package the Code and Deploy it to Internal NPM Repository
Build the Package: Ensure all dependencies are installed and the package is built. Run the following commands in your project directory:

npm install
npm run build

Publish to Internal NPM Repository: Configure your npm to use your internal repository. You can do this by setting the registry in your .npmrc file:

npm set registry <your-internal-npm-registry-url>

Then, publish the package:

npm publish

Add Package to Your TestCafe Project
Update package.json: Add the newly published package to the dependencies section of your TestCafe project's package.json file:

"dependencies": {
  "testcafe-reporter-reportportal": "npm:@nott/testcafe-reporter-nott-reportportal"
}

Install the Dependency: Run the following command to install the dependency in your TestCafe project:

By following these steps, you will package the code, deploy it to your internal npm repository, and add it as a dependency to your TestCafe project.

npm install

## Usage

Please refer readme @ git (https://github.com/Prasadsimha)


## Settings needed
```
REPORT_PORTAL_BASE_URL=http://example.com
REPORT_PORTAL_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
REPORT_PORTAL_PROJECT_NAME=My_Demo
# Launch name is optional, if not specified the name will default to the project name
REPORT_PORTAL_LAUNCH_NAME=The Launch Name
# Tags are optional, should be separated by coma
REPORT_PORTAL_TAGS=Tag1, Tag2
# Description is optional
REPORT_PORTAL_DESCRIPTION=Run description
```
