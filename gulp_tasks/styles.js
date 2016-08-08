'use strict';

var gulp = require('gulp'),
    noop = function () {},
    $ = require('gulp-load-plugins')({
      pattern: ['gulp-*', 'del']
    });

gulp.task('scss', function () {
  return gulp.src(['src/**/*.scss'])
    .pipe($.sass({ style: 'expanded', includePaths: 'src/scss' }))
    .on('error', function handleError(err) {
      console.error(err.toString());
      this.emit('end');
    })
    .pipe($.autoprefixer())
    .pipe(gulp.dest('dist/'));
});

gulp.task('styles', ['scss'], function () {
  return gulp.src(['dist/*.css', '!dist/*.min.css'])
    .pipe($.csso())
    .pipe($.rename({
      extname: '.min.css'
    }))
    .pipe(gulp.dest('dist/'));
});
