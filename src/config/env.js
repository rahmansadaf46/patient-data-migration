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
    default: 8484,
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
    registration: {
      host: {
        doc: 'PostgreSQL database host for registration',
        format: String,
        default: 'localhost',
        env: 'POSTGRES_REGISTRATION_HOST',
      },
      user: {
        doc: 'PostgreSQL database user for registration',
        format: String,
        default: '',
        env: 'POSTGRES_REGISTRATION_USER',
      },
      password: {
        doc: 'PostgreSQL database password for registration',
        format: String,
        default: '',
        env: 'POSTGRES_REGISTRATION_PASSWORD',
        sensitive: true,
      },
      database: {
        doc: 'PostgreSQL database name for registration',
        format: String,
        default: '',
        env: 'POSTGRES_REGISTRATION_DB_NAME',
      },
      port: {
        doc: 'PostgreSQL database port for registration',
        format: 'port',
        default: 5432,
        env: 'POSTGRES_REGISTRATION_PORT',
      },
    },
    inventory: {
      host: {
        doc: 'PostgreSQL database host for inventory',
        format: String,
        default: 'localhost',
        env: 'POSTGRES_INVENTORY_HOST',
      },
      user: {
        doc: 'PostgreSQL database user for inventory',
        format: String,
        default: '',
        env: 'POSTGRES_INVENTORY_USER',
      },
      password: {
        doc: 'PostgreSQL database password for inventory',
        format: String,
        default: '',
        env: 'POSTGRES_INVENTORY_PASSWORD',
        sensitive: true,
      },
      database: {
        doc: 'PostgreSQL database name for inventory',
        format: String,
        default: '',
        env: 'POSTGRES_INVENTORY_DB_NAME',
      },
      port: {
        doc: 'PostgreSQL database port for inventory',
        format: 'port',
        default: 5432,
        env: 'POSTGRES_INVENTORY_PORT',
      },
    },
    pharmacy: {
      host: {
        doc: 'PostgreSQL database host for pharmacy',
        format: String,
        default: 'localhost',
        env: 'POSTGRES_PHARMACY_HOST',
      },
      user: {
        doc: 'PostgreSQL database user for pharmacy',
        format: String,
        default: '',
        env: 'POSTGRES_PHARMACY_USER',
      },
      password: {
        doc: 'PostgreSQL database password for pharmacy',
        format: String,
        default: '',
        env: 'POSTGRES_PHARMACY_PASSWORD',
        sensitive: true,
      },
      database: {
        doc: 'PostgreSQL database name for pharmacy',
        format: String,
        default: '',
        env: 'POSTGRES_PHARMACY_DB_NAME',
      },
      port: {
        doc: 'PostgreSQL database port for pharmacy',
        format: 'port',
        default: 5432,
        env: 'POSTGRES_PHARMACY_PORT',
      },
    },
    opd: {
      host: {
        doc: 'PostgreSQL database host for opd',
        format: String,
        default: 'localhost',
        env: 'POSTGRES_OPD_HOST',
      },
      user: {
        doc: 'PostgreSQL database user for opd',
        format: String,
        default: '',
        env: 'POSTGRES_OPD_USER',
      },
      password: {
        doc: 'PostgreSQL database password for opd',
        format: String,
        default: '',
        env: 'POSTGRES_OPD_PASSWORD',
        sensitive: true,
      },
      database: {
        doc: 'PostgreSQL database name for opd',
        format: String,
        default: '',
        env: 'POSTGRES_OPD_DB_NAME',
      },
      port: {
        doc: 'PostgreSQL database port for opd',
        format: 'port',
        default: 5432,
        env: 'POSTGRES_OPD_PORT',
      },
    },
    lab: {
      host: {
        doc: 'PostgreSQL database host for lab',
        format: String,
        default: 'localhost',
        env: 'POSTGRES_LAB_HOST',
      },
      user: {
        doc: 'PostgreSQL database user for lab',
        format: String,
        default: '',
        env: 'POSTGRES_LAB_USER',
      },
      password: {
        doc: 'PostgreSQL database password for lab',
        format: String,
        default: '',
        env: 'POSTGRES_LAB_PASSWORD',
        sensitive: true,
      },
      database: {
        doc: 'PostgreSQL database name for lab',
        format: String,
        default: '',
        env: 'POSTGRES_LAB_DB_NAME',
      },
      port: {
        doc: 'PostgreSQL database port for lab',
        format: 'port',
        default: 5432,
        env: 'POSTGRES_LAB_PORT',
      },
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