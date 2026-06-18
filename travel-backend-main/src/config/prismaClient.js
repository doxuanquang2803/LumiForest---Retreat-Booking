const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create the pg connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the PrismaPg adapter
const adapter = new PrismaPg(pool);

// Instantiate the PrismaClient
const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;
