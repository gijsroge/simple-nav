/**
 * Config file
 */
var path = './';

module.exports = {

  /**
   * Scss settings
   */
  scss: {
    src: path + 'demo/simple-nav.scss',
    glob: path + 'demo/**/*.scss',
    settings: {
      outputStyle: 'expanded'
    },
    dest: path + 'demo/css/',
    prefix: [
      'last 2 version',
      '> 1%',
      'ie 8',
      'ie 9',
      'ios 6',
      'android 4'
    ]
  },

  tests: {
    path: './tests/tests.html'
  },

  /**
   * Js Settings
   */
  js: {
    glob: [path + 'js/**/*.js', path + 'src/**/*.js'],
  },

  /**
   * BrowserSync settings
   */
  browsersync: {
    server: {
      baseDir: path,
      index: "demo/index.html"
    },
    notify: false
  },
};
