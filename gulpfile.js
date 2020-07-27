// # Setup

const gulp = require('gulp');

// ## Rollup

const rollup = require('rollup');
const rollupCommonJs = require('@rollup/plugin-commonjs');
const rollupNodeResolve = require('@rollup/plugin-node-resolve');

// ## BrowserSync

const browserSync = require('browser-sync').create();

// ## Utilities

const del = require('del');

// # Private tasks

// ## Bundle JS

async function bundleYogaCaseStudy() {
  const bundle = await rollup.rollup({
    input: 'src/yoga-case-study.js',
    plugins: [
      rollupCommonJs(),
      rollupNodeResolve(),
      // The following is needed because of an issue with yoga.
      // See https://github.com/facebook/yoga/issues/798
      {
        name: 'replace-code',
        transform(code, id) {
          if (!/nbind/.test(id)) return;
          code = code.replace(
            '_a = _typeModule(_typeModule),',
            'var _a = _typeModule(_typeModule);'
          );
          return {
            code,
            map: { mappings: '' },
          };
        },
      },
    ],
  });
  return bundle.write({
    file: `dist/yoga-case-study.js`,
    format: 'iife',
    name: 'caseStudy',
    plugins: [],
    sourcemap: true,
  });
}

// ## Copy HTML files

function copyHTMLFiles() {
  return gulp.src('./src/**/*.html').pipe(gulp.dest('./dist'));
}

// ## Reload browser

function reloadBrowser(cb) {
  browserSync.reload();
  cb();
}

// # Public tasks

exports.clean = function clean() {
  return del('dist/**', { force: true });
};

exports.build = gulp.series([exports.clean, gulp.parallel([bundleYogaCaseStudy, copyHTMLFiles])]);

exports.serve = function serve() {
  browserSync.init({
    server: './dist',
  });

  gulp.watch('./src/**/*', { ignoreInitial: false }, gulp.series(exports.build, reloadBrowser));
};

exports.default = exports.serve;
