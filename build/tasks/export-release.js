'use strict';

const gulp = require('gulp');
const runSequence = require('run-sequence');
const del = require('del');
const vinylPaths = require('vinyl-paths');
const jspm = require('jspm');
const paths = require('../paths');
const bundles = require('../bundles.js');
const resources = require('../export.js');

function getBundles() {
  var bl = [];
  for (var b in bundles.bundles) {
    bl.push(b + '*.js');
  }
  return bl;
}

function getExportList() {
  return resources.list.concat(getBundles());
}

function normalizeExportPaths() {
  const pathsToNormalize = resources.normalize;

  var promises =  pathsToNormalize.map(function(pathSet) {
    var packageName = pathSet[ 0 ];
  var fileList = pathSet[ 1 ];

    return jspm.normalize(packageName).then(function(normalized) {
          var packagePath = normalized.substring(normalized.indexOf('jspm_packages'), normalized.lastIndexOf('.js'));
      return fileList.map(function(file) {return packagePath + file; });
    });
  });

  return Promise.all(promises)
    .then(function (normalizedPaths) {
      return normalizedPaths.reduce(function (prev, curr) { return prev.concat(curr), []; });
    });
}

// deletes all files in the output path
gulp.task('clean-export', function() {
  return gulp.src([ paths.exportSrv ])
    .pipe(vinylPaths(del));
});

gulp.task('export-copy', function() {
  return gulp.src(getExportList(), { base: '.' })
    .pipe(gulp.dest(paths.exportSrv));
});

gulp.task('export-normalized-resources', function() {
  return normalizeExportPaths().then(function(normalizedPaths) {
    return gulp.src(normalizedPaths, { base: '.' })
      .pipe(gulp.dest(paths.exportSrv));
  });
});

gulp.task('export-fontawesome', function() {
   return gulp.src('themes/*.*')
       .pipe(gulp.dest(paths.exportSrv + 'themes/'));
});

gulp.task('export-semantic-ui', function() {
  return gulp.src([
        paths.output + 'images/*.*',
        paths.output + 'fonts/*.*',
        paths.output + paths.semanticFonts + '*.*'
      ],
      { base: paths.output })
      .pipe(gulp.dest(paths.exportSrv + 'dist/'));
});

gulp.task('export-assets', function(callback) {
    return runSequence(
        'export-fontawesome',
        'export-semantic-ui',
        callback
    );
})


// use after prepare-release
gulp.task('export', function(callback) {
  return runSequence(
    'bundle',
    'clean-export',
    'export-normalized-resources',
    'export-copy',
    'export-assets',
    'usemin',
    callback
  );
});
