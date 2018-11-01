const api = require("./api");
const auth = require("./auth");
const broadcast = require("./broadcast");
const config = require("./config");
const formatter = require("./formatter")(api);
const utils = require("./utils");

const SMOKE = {
  api,
  auth,
  broadcast,
  config,
  formatter,
  utils
};

if (typeof window !== "undefined") {
  window.SMOKE = SMOKE;
}

if (typeof global !== "undefined") {
  global.SMOKE = SMOKE;
}

exports = module.exports = SMOKE;
