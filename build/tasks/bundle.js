var gulp = require('gulp');
var bundler = require('aurelia-bundler');
var bundles = require('../bundles.js');
var paths = require('../paths');
var usemin = require('gulp-usemin');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');

var config = {
  force: true,
  baseURL: '.',
  configPath: './config.js',
  bundles: bundles.bundles
};

gulp.task('bundle', ['build'], function() {
  return bundler.bundle(config);
});

gulp.task('unbundle', function() {
  return bundler.unbundle(config);
});

gulp.task('usemin', function() {
  return gulp.src('./index.html')
      .pipe(usemin({
        css: [rev()],
        html: [minifyHtml({empty: true})],
        js: [uglify(), rev()],
        inlinejs: [uglify()],
        inlinecss: [minifyCss(), 'concat']
      }))
      .pipe(gulp.dest(paths.exportSrv));
});