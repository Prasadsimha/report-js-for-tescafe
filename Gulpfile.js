// Import necessary modules
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const babel = require('gulp-babel');
const mocha = require('gulp-mocha');
const del = require('del');

// Task to clean the 'lib' directory
gulp.task('clean', function () {
    return del('lib');
});

// Task to lint the JavaScript files
gulp.task('lint', function () {
    return gulp
        .src([
            'src/**/*.js',
            'test/**/*.js',
            'Gulpfile.js'
        ])
        .pipe(eslint({
            rules: {
                indent: 0,
                'consistent-return': 0,
                'space-infix-ops': 0
            }
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// Task to build the project
gulp.task('build', gulp.series('clean', 'lint', function () {
    return gulp
        .src('src/**/*.js')
        .pipe(babel({ optional: ['runtime'] }))
        .pipe(gulp.dest('lib'));
}));

// Task to run tests
gulp.task('test', gulp.series('build', function () {
    return gulp
        .src('test/**/*.js')
        .pipe(mocha({
            ui: 'bdd',
            reporter: 'spec',
            timeout: typeof v8debug === 'undefined' ? 2000 : Infinity // Disable timeouts in debug mode
        }));
}));

// Task to preview the reporter plugin
gulp.task('preview', gulp.series('build', function () {
    const buildReporterPlugin = require('testcafe').embeddingUtils.buildReporterPlugin;
    const pluginFactory = require('./lib');
    const reporterTestCalls = require('./test/utils/reporter-test-calls');
    const plugin = buildReporterPlugin(pluginFactory);

    console.log();

    reporterTestCalls.forEach(function (call) {
        plugin[call.method].apply(plugin, call.args);
    });

    process.exit(0);
}));

// Default task
gulp.task('default', gulp.series('test'));