// Metro config. The shared API contracts live inside this app (src/shared), so
// the "@relaydesk/shared" specifier resolves to a local, self-contained copy.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  "@relaydesk/shared": path.resolve(__dirname, "src/shared"),
};

module.exports = config;
