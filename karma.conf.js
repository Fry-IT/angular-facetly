'use strict';

module.exports = function (config) {
  config.set({
    browsers: ['PhantomJS'],
    frameworks: ['jasmine'],
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/lodash/lodash.js',
      'bower_components/angular-lodash/angular-lodash.js',
      'src/**/*.js',
      'tests/**/*.js'
    ],
    plugins: ['karma-jasmine', 'karma-phantomjs-launcher'],
    reporters: ['progress']
  });
};
