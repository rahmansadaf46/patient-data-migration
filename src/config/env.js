const convict = require('convict');
require('dotenv').config(); // Load .env file into process.env

const config = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 6969,
    env: 'PORT',
  },
  mongo: {
    uri: {
      doc: 'MongoDB connection URI',
      format: String,
      default: '',
      env: 'MONGO_URI',
    },
  },
  mysql: {
    host: {
      doc: 'MySQL database host',
      format: String,
      default: 'localhost',
      env: 'DB_HOST',
    },
    user: {
      doc: 'MySQL database user',
      format: String,
      default: '',
      env: 'DB_USER',
    },
    password: {
      doc: 'MySQL database password',
      format: String,
      default: '',
      env: 'DB_PASSWORD',
      sensitive: true,
    },
    database: {
      doc: 'MySQL database name',
      format: String,
      default: '',
      env: 'DB_NAME',
    },
    port: {
      doc: 'MySQL database port',
      format: 'port',
      default: 3306,
      env: 'DB_PORT',
    },
  },
  postgres: {
    host: {
      doc: 'PostgreSQL database host',
      format: String,
      default: 'localhost',
      env: 'DB_HOST',
    },
    user: {
      doc: 'PostgreSQL database user',
      format: String,
      default: '',
      env: 'POSTGRES_DB_USER',
    },
    password: {
      doc: 'PostgreSQL database password',
      format: String,
      default: '',
      env: 'POSTGRES_DB_PASSWORD',
      sensitive: true,
    },
    database: {
      doc: 'PostgreSQL database name',
      format: String,
      default: '',
      env: 'POSTGRES_DB_NAME',
    },
    port: {
      doc: 'PostgreSQL database port',
      format: 'port',
      default: 5432,
      env: 'POSTGRES_DB_PORT',
    },
  },
  organization_id: {
    doc: 'Organization ID',
    format: String,
    default: '',
    env: 'ORGANIZATION_ID',
  },
  hospital_id: {
    doc: 'Hospital ID',
    format: String,
    default: '',
    env: 'HOSPITAL_ID',
  },
});

// Validate configuration
config.validate({ allowed: 'strict' });

module.exports = config;