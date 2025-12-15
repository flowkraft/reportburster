const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const less = require('gulp-less');
const typescript = require('gulp-typescript');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const watch = require('gulp-watch');

// Task for minifying CSS files
gulp.task('minify-css', function () {
  return gulp.src('resources/assets/css/*.css')
    .pipe(cleanCSS())
    .pipe(gulp.dest('public/css'));
});

// Task for compiling Sass
gulp.task('sass', function () {
  return gulp.src('resources/assets/css/*.scss')
    .pipe(sass())
    .pipe(cleanCSS())
    .pipe(gulp.dest('public/css'));
});

// Task for compiling Less
gulp.task('less', function () {
  return gulp.src('resources/assets/css/*.less')
    .pipe(less())
    .pipe(cleanCSS())
    .pipe(gulp.dest('public/css'));
});

// Task for minifying JavaScript files
gulp.task('minify-js', function () {
  return gulp.src('resources/assets/js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

// Task for compiling TypeScript
gulp.task('typescript', function () {
  return gulp.src('resources/assets/js/*.ts')
    .pipe(typescript())
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

// Task for compiling React JSX
gulp.task('react', function () {
  return gulp.src('resources/assets/js/*.jsx')
    .pipe(babel({
      presets: ['@babel/preset-env', '@babel/preset-react']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

// Task for compiling React TSX
gulp.task('react-tsx', function () {
  return gulp.src('resources/assets/js/*.tsx')
    .pipe(babel({
      presets: ['@babel/preset-env', '@babel/preset-react']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('public/js'));
});

// Task for watching changes in CSS and JavaScript files
gulp.task('watch', function () {
  gulp.watch('resources/assets/css/**/*.css', gulp.series('minify-css'));
  gulp.watch('resources/assets/css/**/*.scss', gulp.series('sass'));
  gulp.watch('resources/assets/css/**/*.less', gulp.series('less'));
  gulp.watch('resources/assets/js/**/*.ts', gulp.series('typescript'));
  gulp.watch('resources/assets/js/**/*.jsx', gulp.series('react'));
  gulp.watch('resources/assets/js/**/*.tsx', gulp.series('react-tsx'));
  gulp.watch('resources/assets/js/**/*.js', gulp.series('minify-js'));
});

// Default task to run all tasks
gulp.task('build', gulp.parallel('minify-css', 'sass', 'less', 'minify-js', 'typescript', 'react', 'react-tsx',));
