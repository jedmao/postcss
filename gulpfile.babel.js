import gulp from 'gulp';

gulp.task('clean', () => {
    let del = require('del');
    return del(['postcss.js', 'build/', 'coverage/']);
});

// Build

gulp.task('build:lib', ['clean'], done => {
    let trimLines = require('gulp-trimlines');
    let rename = require('gulp-rename');
    let babel = require('gulp-babel');
    let merge = require('event-stream').merge;
    let filter = require('gulp-filter');
    let ts = require('gulp-typescript');
    let project = ts.createProject('tsconfig.json');
    project.typescript = require('typescript');
    let tsCompilerOptions = require('./tsconfig').compilerOptions;
    let result = project.src().pipe(ts(project));
    merge(
        result.dts
            .pipe(filter(['**', '!test-ts/**']))
            .pipe(trimLines({ leading: false }))
            .pipe(gulp.dest(tsCompilerOptions.outDir)),
        result.js
            .pipe(rename(path => {
                path.extname = '.es6';
            }))
            .pipe(gulp.dest(tsCompilerOptions.outDir))
    ).on('end', () => {
        gulp.src('build/lib-ts/*.es6')
            .pipe(babel({ loose: 'all' }))
            .pipe(gulp.dest('build/lib'))
            .on('end', done);
    });
});

gulp.task('build:docs', ['clean'], () => {
    let ignore = require('fs').readFileSync('.npmignore').toString()
        .trim().split(/\n+/)
        .concat(['.npmignore', 'index.js', 'package.json',
                 'lib/*', 'test/*', 'node_modules/**/*',
                 'lib-ts/*', 'test-ts/*', 'typings/**'])
        .map( i => '!' + i );
    return gulp.src(['**/*'].concat(ignore))
        .pipe(gulp.dest('build'));
});

gulp.task('build:package', ['clean'], () => {
    let editor = require('gulp-json-editor');
    return gulp.src('./package.json')
        .pipe(editor( json => {
            json.main = 'lib/postcss';
            for ( let i in json.dependencies ) {
                if ( /^babel-/.test(i) ) {
                    json.devDependencies[i] = json.dependencies[i];
                    delete json.dependencies[i];
                }
            }
            return json;
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('build', ['build:lib', 'build:docs', 'build:package']);

// Lint

gulp.task('lint', () => {
    let eslint = require('gulp-eslint');
    return gulp.src(['*.js', 'lib/*.es6', 'test/*.es6'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('spellcheck', () => {
    let shell = require('gulp-shell');
    return gulp.src(['*.md', 'docs/**/*.md'], { read: false })
        .pipe(shell('yaspeller <%= file.path %>'));
});

// Tests

gulp.task('test', () => {
    require('./');
    let mocha = require('gulp-mocha');
    return gulp.src('build/test-ts/*.es6', { read: false }).pipe(mocha());
});

gulp.task('integration', ['build:lib', 'build:package'], done => {
    let postcss = require('./build/lib/postcss');
    let real    = require('postcss-parser-tests/real');
    real(done, css => {
        return postcss.parse(css).toResult({ map: { annotation: false } });
    });
});

// Coverage

gulp.task('coverage:instrument', () => {
    require('./');
    let istanbul = require('gulp-istanbul');
    let isparta  = require('isparta');
    return gulp.src('build/lib-ts/*.es6')
        .pipe(istanbul({
            includeUntested: true,
            instrumenter:    isparta.Instrumenter
        }))
        .pipe(istanbul.hookRequire({
            extensions: ['.es6']
        }));
});

gulp.task('coverage:report', () => {
    let istanbul = require('gulp-istanbul');
    return gulp.src('build/test-ts/*.es6', { read: false })
        .pipe(istanbul.writeReports({
            reporters: ['lcov', 'text-summary']
        }))
        .pipe(istanbul.enforceThresholds({
            thresholds: {
                global: {
                    statements: 100,
                    functions:  100,
                    lines:      100
                }
            }
        }));
});

gulp.task('coverage', ['build:lib', 'build:package'], done => {
    let runSequence = require('run-sequence');
    runSequence('coverage:instrument', 'test', 'coverage:report', done);
});

// Common

gulp.task('default', ['lint', 'spellcheck', 'coverage', 'integration']);
