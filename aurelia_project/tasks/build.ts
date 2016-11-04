import * as gulp from 'gulp';
import transpile from './transpile';
import processMarkup from './process-markup';
import processCSS from './process-css';
import {build, CLIOptions} from 'aurelia-cli';
import * as project from '../aurelia.json';

const env = CLIOptions.getEnvironment();

export default gulp.series(
  readProjectConfiguration,
  gulp.parallel(
    transpile,
    processMarkup,
    processCSS
  ),
  copyImages,
  copyTheme,
  copyMisc,
  writeBundles
);

function readProjectConfiguration() {
  return build.src(project);
}

function writeBundles() {
  return build.dest();
}

function copyImages() {
  return gulp.src(project.paths.assets.images)
    .pipe(gulp.dest('images/'));
}

function copyTheme() {
  return gulp.src(project.paths.assets.theme)
    .pipe(gulp.dest('themes/'));
}

function copyMisc() {
  return gulp.src(project.paths.assets.misc)
    .pipe(gulp.dest('/'))
}