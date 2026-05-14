const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
let config = { GEMINI_API_KEY: '' };

// Load initial config
if (fs.existsSync(CONFIG_PATH)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    console.error('Error reading config.json:', err.message);
  }
}

const getConfig = () => config;

const updateConfig = (newConfig) => {
  if (newConfig.key && newConfig.value !== undefined) {
    config[newConfig.key] = newConfig.value;
  } else {
    config = { ...config, ...newConfig };
  }
  // Clean up any legacy 'key' or 'value' properties that might have been accidentally added
  if (newConfig.key !== 'key') delete config.key;
  if (newConfig.key !== 'value') delete config.value;

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  return config;
};

module.exports = {
  getConfig,
  updateConfig,
  CONFIG_PATH
};
