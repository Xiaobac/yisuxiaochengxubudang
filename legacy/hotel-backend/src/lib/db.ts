// lib/db.ts
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq, and, desc } from 'drizzle-orm'
import * as schema from './schema'

// 开发环境连接池优化
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 开发环境下全局连接复用
const globalForDb = globalThis as unknown as {
  conn: Pool | undefined
}

export const db = drizzle(globalForDb.conn || pool, { schema })

if (process.env.NODE_ENV !== 'production') globalForDb.conn = pool