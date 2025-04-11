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

const postgresPool = new Pool({
  host: config.get('postgres.host'),
  user: config.get('postgres.user'),
  password: config.get('postgres.password'),
  database: config.get('postgres.database'),
  port: config.get('postgres.port'),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const connectDatabases = async () => {
  try {
    await connectMongoDB();
    await mysqlPool.query('SELECT 1');
    logger.info('✅ MySQL Connected Successfully');
    const client = await postgresPool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('✅ PostgreSQL Connected Successfully');
  } catch (error) {
    logger.error('❌ Database Connection Failed', { error: error.message });
    throw error;
  }
};

module.exports = { connectMongoDB, mysqlPool, postgresPool, connectDatabases };