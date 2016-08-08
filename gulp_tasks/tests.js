'use strict';

var gulp = require('gulp'),
    KarmaServer  = require('karma').Server;

gulp.task('watch-test', ['js', 'scss'], function (done) {
  new KarmaServer(
    {
      configFile: __dirname + '/../karma.conf.js', singleRun: false, autoWatch: true
    },
    function () {
      done();
    }
  ).start();
});

gulp.task('test', ['js', 'scss'], function (done) {
  new KarmaServer(
    {
      configFile: __dirname + '/../karma.conf.js', singleRun: true, autoWatch: false
    },
    function () {
      done();
    }
  ).start();
});
