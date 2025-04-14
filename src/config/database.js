const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const config = require('./env');
const logger = require('./logger');

const connectMongoDB = async () => {
  try {
    await mongoose.connect(config.get('mongo.uri'));
    logger.info('✅ MongoDB Connected Successfully');
  } catch (error) {
    logger.error('❌ MongoDB Connection Failed', { error: error.message });
    throw error;
  }
};

const mysqlPool = mysql.createPool({
  host: config.get('mysql.host'),
  user: config.get('mysql.user'),
  password: config.get('mysql.password'),
  database: config.get('mysql.database'),
  port: config.get('mysql.port'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create separate postgresPool instances for each database (unchanged)
const registrationPostgresPool = new Pool({
  host: config.get('postgres.registration.host'),
  user: config.get('postgres.registration.user'),
  password: config.get('postgres.registration.password'),
  database: config.get('postgres.registration.database'),
  port: config.get('postgres.registration.port'),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const inventoryPostgresPool = new Pool({
  host: config.get('postgres.inventory.host'),
  user: config.get('postgres.inventory.user'),
  password: config.get('postgres.inventory.password'),
  database: config.get('postgres.inventory.database'),
  port: config.get('postgres.inventory.port'),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const pharmacyPostgresPool = new Pool({
  host: config.get('postgres.pharmacy.host'),
  user: config.get('postgres.pharmacy.user'),
  password: config.get('postgres.pharmacy.password'),
  database: config.get('postgres.pharmacy.database'),
  port: config.get('postgres.pharmacy.port'),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const opdPostgresPool = new Pool({
  host: config.get('postgres.opd.host'),
  user: config.get('postgres.opd.user'),
  password: config.get('postgres.opd.password'),
  database: config.get('postgres.opd.database'),
  port: config.get('postgres.opd.port'),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const labPostgresPool = new Pool({
  host: config.get('postgres.lab.host'),
  user: config.get('postgres.lab.user'),
  password: config.get('postgres.lab.password'),
  database: config.get('postgres.lab.database'),
  port: config.get('postgres.lab.port'),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connectDatabases = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Connect to MySQL
    await mysqlPool.query('SELECT 1');
    logger.info('✅ MySQL Connected Successfully');

    // Attempt to connect to each PostgreSQL database individually
    const postgresConnections = [
      { pool: registrationPostgresPool, name: 'PostgreSQL Registration' },
      { pool: inventoryPostgresPool, name: 'PostgreSQL Inventory' },
      { pool: pharmacyPostgresPool, name: 'PostgreSQL Pharmacy' },
      { pool: opdPostgresPool, name: 'PostgreSQL OPD' },
      { pool: labPostgresPool, name: 'PostgreSQL Lab' },
    ];

    for (const { pool, name } of postgresConnections) {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        logger.info(`✅ ${name} Connected Successfully`);
      } catch (error) {
        logger.warn(`⚠️ ${name} Connection Failed`, { error: error.message });
        // Continue to the next database instead of throwing
      }
    }

    // Check if at least one PostgreSQL database connected successfully
    const successfulConnections = postgresConnections.filter(async ({ pool }) => {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
      } catch {
        return false;
      }
    });

    if (successfulConnections.length === 0) {
      throw new Error('No PostgreSQL databases could be connected');
    }

  } catch (error) {
    logger.error('❌ Database Connection Failed', { error: error.message });
    throw error;
  }
};

module.exports = {
  connectMongoDB,
  mysqlPool,
  registrationPostgresPool,
  inventoryPostgresPool,
  pharmacyPostgresPool,
  opdPostgresPool,
  labPostgresPool,
  connectDatabases,
};