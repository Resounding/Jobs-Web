var appRoot = 'src/';
var outputRoot = 'dist/';
var exporSrvtRoot = 'export/';
var fontAwesomeFontsRoot = 'jspm_packages/npm/font-awesome@4.6.3/fonts/'

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.ts',
  html: appRoot + '**/*.html',
  less: 'styles/*.less',
  style: 'styles/**/*.css',
  images: 'images/**/*.*',
  fontAwesomeFonts: fontAwesomeFontsRoot + '*.*',
  output: outputRoot,
  exportSrv: exporSrvtRoot,
  doc: './doc',
  e2eSpecsSrc: 'test/e2e/src/**/*.ts',
  e2eSpecsDist: 'test/e2e/dist/',
  dtsSrc: [
    './typings/**/*.d.ts',
    './custom_typings/**/*.d.ts'
  ]
}
