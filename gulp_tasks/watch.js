'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
      pattern: ['gulp-*']
    });

gulp.task('watch', ['js', 'scss'], function () {
  gulp.watch('src/**/*.{js,html}', ['lint', 'js']);
  gulp.watch('src/**/*.scss', ['scss']);
});
