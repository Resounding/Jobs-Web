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
  writeBundles,
  exportApp
);

function readProjectConfiguration() {
  return build.src(project);
}

function writeBundles() {
  return build.dest();
}

function exportApp() {
  if(env !== 'prod')  return Promise.resolve();


}
