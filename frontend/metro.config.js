const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add custom resolver settings
config.resolver.alias = {
  "@": "./src",
  "@/components": "./src/components",
  "@/screens": "./src/screens",
  "@/store": "./src/store",
  "@/hooks": "./src/hooks",
  "@/utils": "./src/utils",
  "@/types": "./src/types",
};

// Add support for additional file types
config.resolver.assetExts.push(
  // Audio formats
  "mp3",
  "wav",
  "m4a",
  "aac",
  // Animation formats
  "lottie",
  // Font formats
  "otf"
);

// Transformer settings for better performance
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
