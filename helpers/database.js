/**
 * @file PostgreSQL connection pool shared by every model.
 *
 * Connection settings come from the standard libpq environment variables:
 * `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` and `PGPASSWORD`. Set
 * `PGSSLMODE=disable` to connect to a local database without TLS.
 * @module helpers/database
 */

import pg from 'pg'

// Timestamps in the database are UK wall-clock times stored without a time
// zone. Pinning the process zone means node-postgres turns them into the
// right instants whatever the host's own zone is (Azure defaults to UTC).
process.env.TZ = 'Europe/London'

/** OID of the PostgreSQL `timestamp without time zone` type. */
const TIMESTAMP_OID = 1114

// Return single timestamp values as the raw database string, unchanged.
pg.types.setTypeParser(TIMESTAMP_OID, value => value)

/**
 * The shared connection pool.
 * @type {pg.Pool}
 */
const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number.parseInt(process.env.PGPORT ?? '', 10) || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000
})

// An idle client can be dropped by the server at any time. Without a
// listener that emits an unhandled 'error' event and crashes the process.
pool.on('error', err => {
  console.error('Unexpected error on idle PostgreSQL client:', err)
})

export default pool
