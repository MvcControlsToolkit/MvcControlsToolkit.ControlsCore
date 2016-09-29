module.exports = function (gulp) {
    
    var groot = "./node_modules/globalize/dist/";
    var croot = "./node_modules/cldrjs/dist/"
    var globalizePath = "./wwwroot/lib/globalize"
    var uglify = require("gulp-uglify"),
        concat = require("gulp-concat");
    gulp.task('min:globalize', function () {
        
        return gulp.src([
        croot + "cldr.js",
        croot + "cldr/event.js",
        croot + "cldr/supplemental.js",
        groot + "globalize.js",
        groot + "globalize/number.js",
        groot + "globalize/date.js",
 //       groot + "globalize/currency.js",
 //       groot + "globalize/relative-time.js",
        ], { base: "." })
    .pipe(concat(globalizePath+"/globalize.min.js"))
    .pipe(uglify())
    .pipe(gulp.dest("."));
    })
    gulp.task('move:gdata', function () {
        return gulp.src(["./node_modules/cldr-data/segments/**/*.*", "./node_modules/cldr-data/supplemental/**/*.*",
            "./node_modules/cldr-data/main/en-AU/*.*",
            "./node_modules/cldr-data/main/en-CA/*.*",
            "./node_modules/cldr-data/main/en-GB/*.*",
            "./node_modules/cldr-data/main/en/*.*",
            "./node_modules/cldr-data/main/es-MX/*.*",
            "./node_modules/cldr-data/main/es/*.*",
            "./node_modules/cldr-data/main/fr-CA/*.*",
            "./node_modules/cldr-data/main/fr/*.*",
            "./node_modules/cldr-data/main/it-CH/*.*",
            "./node_modules/cldr-data/main/it/*.*",
            "./node_modules/cldr-data/main/de/*.*"],
            { base: './node_modules' })
    .pipe(gulp.dest(globalizePath));
    })
}