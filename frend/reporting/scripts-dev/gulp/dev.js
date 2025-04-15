const jetpack = require("fs-jetpack");
const gulp = require("gulp");

gulp.task("dev-file-replacements", () => {
  return jetpack.copyAsync(
    "src/environments/environment.dev.ts",
    "src/environments/environment.ts",
    {
      overwrite: true,
    }
  );
});
