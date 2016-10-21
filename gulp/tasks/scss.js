/* SCSS task */

/**
 * plugins
 */
var gulp = require('gulp'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-sass'),
  reporter = require("postcss-reporter"),
  syntax = require("postcss-scss"),
  postcss = require('gulp-postcss'),
  autoprefixer = require('autoprefixer'),
  browserSync = require('browser-sync'),
  sourcemaps = require('gulp-sourcemaps');

/**
 * configfile
 */
var config = require('../config');

/**
 * Postcss processors
 */
var processors = [
  autoprefixer(config.scss.prefix)
];

/**
 * Tasks
 */
gulp.task("lint-styles", function () {
  gulp.src(config.scss.src)
    .pipe(plumber())
    .pipe(postcss([
      stylelint(config.scss.lint),
      reporter({clearMessages: true})
    ], {syntax: syntax}));
});

gulp.task('scss', ["lint-styles"], function () {
  gulp.src(config.scss.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass.sync(config.scss.settings)
      .pipe(sass())
      .on('error', sass.logError))
    .pipe(postcss(processors, {syntax: syntax}))
    .pipe(sourcemaps.write('.'))
    .pipe(browserSync.stream({match: '**/*.css'}))
    .pipe(gulp.dest(config.styleguide.dest))
    .pipe(gulp.dest(config.styleguide.jekyllDest))
    .pipe(gulp.dest(config.scss.dest))
});
