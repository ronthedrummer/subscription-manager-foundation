let config: any;

const env = process.env.NODE_ENV || 'production';

try {
  config = require(`../../config.${env}.json`);
} catch (err) {
  console.warn(`Warning: no config file found for environment '${env}'.`);

  try {
    config = require(`../../config.dev.json`);
  } catch (err) {
    console.warn(
      `Warning: no development config file found. Falling back to production.`
    );

    config = require(`../../config.production.json`);
  }
}

export default config;
