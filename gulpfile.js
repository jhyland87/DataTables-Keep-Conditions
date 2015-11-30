const gulp   = require('gulp');
const babel  = require('gulp-babel');
const minify = require('gulp-minify');
const rename = require("gulp-rename");
const del    = require('del');

gulp.task('transpile', () => {
    return gulp.src('src/dataTables.keepConditions.jsx')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('compress', ['transpile'], () => {
    return gulp.src('dist/dataTables.keepConditions.js')
        .pipe(minify({
            //preserveComments: 'all'
        }))
        .pipe(gulp.dest('dist'))
});

gulp.task('rename', ['compress'], () => {
    gulp.src("dist/dataTables.keepConditions-min.js")
        .pipe(rename("dataTables.keepConditions.min.js"))
        .pipe(gulp.dest("dist"));

    return del('dist/dataTables.keepConditions-min.js');
});

gulp.task('default', ['transpile', 'compress', 'rename']);
