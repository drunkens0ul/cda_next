import { Pool, PoolClient, QueryResult, QueryResultRow, types } from 'pg'

// Configure pg to return DATE types (OID 1082) as strings instead of Date objects
// This prevents timezone issues when serializing dates
types.setTypeParser(1082, (val) => val) // DATE type - return as-is (YYYY-MM-DD string)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: '-c timezone=UTC',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export { pool }

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const result = await pool.query<T>(text, params)
    const duration = Date.now() - start
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount })
    }
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export async function getClient() {
  const client = await pool.connect()
  return client
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
