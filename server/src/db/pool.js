import pg from 'pg';
import { env, isProduction } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
      }
    : false,
});

pool.on('error', (error) => {
  console.error('Unexpected Postgres pool error', error);
});
