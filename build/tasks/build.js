var gulp = require('gulp');
var runSequence = require('run-sequence');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var paths = require('../paths');
var assign = Object.assign || require('object.assign');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');
var typescript = require('gulp-typescript');

// transpiles changed es6 files to SystemJS format
// the plumber() call prevents 'pipe breaking' caused
// by errors from other gulp plugins
// https://www.npmjs.com/package/gulp-plumber
var typescriptCompiler = typescriptCompiler || null;
gulp.task('build-system', function() {
  if(!typescriptCompiler) {
    typescriptCompiler = typescript.createProject('tsconfig.json', {
      "typescript": require('typescript')
    });
  }
  return gulp.src(paths.dtsSrc.concat(paths.source))
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(changed(paths.output, {extension: '.ts'}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(typescript(typescriptCompiler))
    .pipe(sourcemaps.write('.', {includeContent: false, sourceRoot: '/src'}))
    .pipe(gulp.dest(paths.output));
});

// copies changed html files to the output directory
gulp.task('build-html', function() {
  return gulp.src(paths.html)
    .pipe(changed(paths.output, {extension: '.html'}))
    .pipe(gulp.dest(paths.output));
});

// compiles less files
gulp.task('build-less', function() {
  return gulp.src(paths.less)
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(changed(paths.output, {extension: '.less'}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(less({ paths: [paths.less]}))
    .pipe(gulp.dest(paths.output + 'styles/'));
});

gulp.task('build-images', function() {
  return gulp.src(paths.images)
      .pipe(gulp.dest(paths.output + 'images/'));
});

gulp.task('build-fontawesome', function() {
  return gulp.src(paths.fontAwesome)
      .pipe(gulp.dest(paths.output + 'fonts/'));
});

gulp.task('build-semantic-fonts', function() {
  return gulp.src(paths.semanticUI)
      .pipe(gulp.dest(paths.output + 'styles/themes/default/assets/fonts/'));
})

gulp.task('build-fonts', function(callback) {
  return runSequence(
    'build-fontawesome',
    'build-semantic-fonts',
    callback
  );
});

// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    ['build-system', 'build-html', 'build-less', 'build-images', 'build-fonts'],
    callback
  );
});
