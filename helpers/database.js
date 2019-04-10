const pg = require('pg');

const config = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
  ssl: true,
  max: 10,
  idleTimeoutMillis: 30000
}

var pool = new pg.Pool(config);

module.exports = pool;