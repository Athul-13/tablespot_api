"use strict";
const path = require("path");
const distDir = path.join(__dirname, "dist");
require("tsconfig-paths").register({
  baseUrl: distDir,
  paths: {
    "@/*": ["*"],
    "@/config/*": ["config/*"],
    "@/controllers/*": ["controllers/*"],
    "@/di/*": ["di/*"],
    "@/errors/*": ["errors/*"],
    "@/lib/*": ["lib/*"],
    "@/middleware/*": ["middleware/*"],
    "@/models/*": ["models/*"],
    "@/repositories/*": ["repositories/*"],
    "@/routes/*": ["routes/*"],
    "@/services/*": ["services/*"],
    "@/types/*": ["types/*"],
    "@/utils/*": ["utils/*"],
  },
});
require("./dist/index.js");
