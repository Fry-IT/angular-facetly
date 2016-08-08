'use strict';

var gulp = require('gulp'),
    noop = function () {},
    stylish = require('jshint-stylish'),
    $ = require('gulp-load-plugins')({
      pattern: ['gulp-*']
    });

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js'])
    .pipe($.jshint())
    .pipe($.jshint.reporter(stylish));
});

gulp.task('js', ['partials'], function () {
  return gulp.src(['src/**/*.js', '.tmp/inject/**/*js'])
    .pipe($.concat('angular-facetly.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('partials', function () {
  return gulp.src(['src/**/*.html'])
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
      module: 'ngFacetly'
    }))
    .pipe(gulp.dest('.tmp/inject/'));
});

gulp.task('scripts', ['lint', 'js'], function () {
  return gulp.src(['dist/*.js', '!dist/*.min.js'])
    .pipe($.stripDebug())
    .pipe($.uglify())
    .pipe($.rename({
      extname: '.min.js'
    }))
    .pipe(gulp.dest('dist/'));
});
