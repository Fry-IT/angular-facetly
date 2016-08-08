'use strict';

var gulp = require('gulp');

require('require-dir')('./gulp_tasks');

gulp.task('default', ['clean'], function () {
  gulp.start('watch');
});
