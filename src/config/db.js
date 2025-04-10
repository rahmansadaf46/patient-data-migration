const mongoose = require("mongoose");
const mysql = require("mysql2");
const { Pool } = require('pg');
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error);
    // process.exit(1);
  }
};

const connectPostgresDB = async () => {
  const pgPool = new Pool({
    host: process.env.DB_HOST, // Reusing DB_HOST (localhost)
    user: process.env.POSTGRES_DB_USER,
    password: process.env.POSTGRES_DB_PASSWORD,
    database: process.env.POSTGRES_DB_NAME,
    port: process.env.POSTGRES_DB_PORT || 5432, // Default PostgreSQL port is 5432
    max: 10, // Similar to MySQL's connectionLimit
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 2000, // Timeout for acquiring a connection
  });

  try {
    const client = await pgPool.connect();
    await client.query("SELECT 1"); // Test query
    console.log("✅ PostgreSQL Connected Successfully");
    client.release(); // Release the client back to the pool
    return pgPool; // Return the pool for use in other modules
  } catch (error) {
    console.error("❌ PostgreSQL Connection Failed:", error.message);
    // process.exit(1); // Uncomment if you want to exit on failure
    throw error; // Throw error to handle it in the calling code
  }
};

connectPostgresDB()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const mysqlDB = pool.promise();
mysqlDB.query("SELECT 1")
  .then(() => console.log("✅ MySQL Connected Successfully"))
  .catch(err => console.error("❌ MySQL Connection Failed:", err.message));

module.exports = { connectPostgresDB, connectDB, mysqlDB };
