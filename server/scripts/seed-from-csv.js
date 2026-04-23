import { pool } from '../src/db/pool.js';
import { importDefaultCsvs } from '../src/services/import-service.js';
import { recalculateReorderAlerts } from '../src/services/inventory-service.js';

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await importDefaultCsvs(client);
    await recalculateReorderAlerts(client);
    await client.query('COMMIT');
    console.log('Seed import complete', result);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
