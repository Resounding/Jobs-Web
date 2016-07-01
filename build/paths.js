var appRoot = 'src/';
var outputRoot = 'dist/';
var exporSrvtRoot = 'export/';
var themesRoot = 'themes/';
var semanticUIFontsRoot = 'jspm_packages/npm/semantic-ui@2.2.1/dist/themes/default/assets/fonts/';
var fontAwesomeFontsRoot = 'jspm_packages/npm/font-awesome@4.6.3/fonts/'

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.ts',
  html: appRoot + '**/*.html',
  less: 'styles/*.less',
  style: 'styles/**/*.css',
  images: 'images/**/*.*',
  semanticUIFonts: semanticUIFontsRoot + '*.*',
  fontAwesomeFonts: fontAwesomeFontsRoot + '*.*',
  themesRoot: themesRoot,
  themes: themesRoot + 'default/assets/fonts/',
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
