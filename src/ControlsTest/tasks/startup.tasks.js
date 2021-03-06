module.exports = function (gulp) {
    
    var paths = {
        webroot: "./wwwroot/"
    };
    paths.startupjs = paths.webroot + "startupjs/**/*.js";
    paths.startupminJs = paths.webroot + "startupjs/**/*.min.js";
    paths.concatStartupJsDest = paths.webroot + "startupjs/startup.min.js";
    var uglify = require("gulp-uglify"),
        concat = require("gulp-concat");
    gulp.task('min:startup', function () {
        
        return gulp.src([paths.startupjs, "!" + paths.startupminJs], { base: "." })
       .pipe(concat(paths.concatStartupJsDest))
       .pipe(uglify())
       .pipe(gulp.dest("."));
    })
    
}