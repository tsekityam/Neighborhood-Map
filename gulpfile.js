var gulp = require('gulp');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');
var rename = require("gulp-rename");

gulp.task('default', ['copy']);

gulp.task('copy', ['copy-html', 'copy-css', 'copy-js']);

gulp.task('copy-html', function() {
  gulp.src('./*.html')
  .pipe(gulp.dest('./docs/'));
});

gulp.task('copy-css', function() {
  gulp.src('./css/*.css')
  .pipe(cssnano())
  .pipe(rename({
    suffix: '-min'
  }))
  .pipe(gulp.dest('./docs/css/'));
});

gulp.task('copy-js', function() {
  gulp.src('./js/*.js')
  .pipe(uglify())
  .pipe(rename({
    suffix: '-min'
  }))
  .pipe(gulp.dest('./docs/js/'));
});
