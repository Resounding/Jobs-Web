module.exports = {
    "bundles": {
        "dist/app-build": {
            "includes": [
                "[**/*.js]",
                "**/*.html!text",
                "**/*.css!text"
            ],
            "options": {
                "inject": true,
                "minify": false,
                "depCache": true,
                "rev": true
            }
        },
        "dist/aurelia": {
            "includes": [
                "aurelia-framework",
                "aurelia-bootstrapper",
                "aurelia-fetch-client",
                "aurelia-router",
                "aurelia-animator-css",
                "aurelia-templating-binding",
                "aurelia-polyfills",
                "aurelia-templating-resources",
                "aurelia-templating-router",
                "aurelia-loader-default",
                "aurelia-history-browser",
                "aurelia-logging-console",
                "fetch",
                "es6-promise",
                "underscore",
                "pouchdb",
                "pouchdb-find",
                "text"
            ],
            "options": {
                "inject": true,
                "minify": false,
                "depCache": false,
                "rev": true
            }
        }
    }
};
