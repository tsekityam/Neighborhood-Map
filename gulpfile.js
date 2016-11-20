var gulp = require('gulp');
var gulpIf = require('gulp-if');
var useref = require('gulp-useref');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');

gulp.task('default', ['minify', 'copy-json']);

gulp.task('minify', function(){
  return gulp.src('./*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', cssnano()))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('copy-json', function(){
  return gulp.src('./*.json')
    .pipe(gulp.dest('./dist/'))
});
