const { Pool } = require("pg");
require("dotenv").config();

console.log("Environment variables:");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "***" : "NOT SET");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, 
});

module.exports = pool;
