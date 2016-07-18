var appRoot = 'src/';
var outputRoot = 'dist/';
var exporSrvtRoot = 'export/';
var fontAwesomeFontsRoot = 'jspm_packages/npm/font-awesome@4.6.3/fonts/';
var semanticUIAssets = 'jspm_packages/github/Semantic-Org/Semantic-UI@2.2.2/themes/default/assets/fonts/';
var semanticFonts = 'styles/themes/default/assets/fonts/';

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.ts',
  html: appRoot + '**/*.html',
  less: 'styles/*.less',
  style: 'styles/**/*.css',
  images: 'images/**/*.*',
  fontAwesome: fontAwesomeFontsRoot + '*.*',
  semanticUI: semanticUIAssets + '*.*',
  semanticFonts: semanticFonts,
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
