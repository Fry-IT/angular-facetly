'use strict';

var gulp = require('gulp'),
    noop = function () {},
    $ = require('gulp-load-plugins')({
      pattern: ['gulp-*', 'del']
    });

gulp.task('bump-version', function () {
  var bumpType = process.env.BUMP || 'patch'; // major.minor.patch

  gulp.src(['./bower.json', './package.json'])
  .pipe($.bump({ type: bumpType }))
  .pipe(gulp.dest('./'));
});

gulp.task('clean', function (cb) {
  $.del(['dist'], cb);
});

gulp.task('build', ['clean', 'scripts', 'styles']);

gulp.task('release', ['build', 'bump-version'], function (done) {
  var pkg = require('./../bower.json'),
      v = 'v' + pkg.version,
      message = 'Release ' + v;

  gulp.src('./')
    .pipe($.git.add())
    .pipe($.git.commit(message))
    .pipe(gulp.dest('./'))
    .on('end', tag);

  function tag() {
    $.git.tag(v, message);

    gulp.src('changelog.sh', { read: false })
      .pipe($.shell(['bash <%= file.path %>']))
      .on('end', function () {
        gulp.src('./')
          .pipe($.git.add())
          .pipe($.git.commit('Update CHANGELOG.MD for ' + v + ' #nochangelog'))
          .pipe(gulp.dest('./'))
          .on('end', function () {
            $.git.push('origin', 'master', { args: '--tags' });
          });
      });

    done();
  }

});
