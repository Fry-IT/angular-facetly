'use strict';

module.exports = function (config) {
  config.set({
    browsers: ['PhantomJS'],
    frameworks: ['jasmine'],
    preprocessors: {
      'src/**/*.html': ['ng-html2js']
    },
    ngHtml2JsPreprocessor: {
      stripPrefix: 'src/',
      moduleName: 'facetly.templates'
    },
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/lodash/lodash.js',
      'bower_components/angular-lodash/angular-lodash.js',
      'src/**/*.html',
      'src/**/*.js',
      'tests/**/*.js'
    ],
    plugins: ['karma-jasmine', 'karma-phantomjs-launcher', 'karma-ng-html2js-preprocessor'],
    reporters: ['progress']
  });
};
