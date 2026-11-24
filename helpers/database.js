const pg = require('pg')

// Currently using timestamp without timezone so this ensures the time isn't messed with
pg.types.setTypeParser(1114, str => str)

const config = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000
}

const pool = new pg.Pool(config)

// Prevent idle client errors from crashing the Node.js process
pool.on('error', err => {
  console.error('Unexpected error on idle PostgreSQL client:', err)
})

module.exports = pool
