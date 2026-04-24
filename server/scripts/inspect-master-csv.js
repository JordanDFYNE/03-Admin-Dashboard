import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsvBuffer } from '../src/utils/csv.js';
import { parseNumeric } from '../src/utils/parsers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const filePath = path.resolve(
    __dirname,
    '../../Consumables Inventory - Comsumables Inventory.csv'
  );
  const buffer = await fs.readFile(filePath);
  const records = parseCsvBuffer(buffer);

  for (const record of records.slice(0, 10)) {
    console.log({
      name: record['Stock name '] || record['Stock name'],
      rawQty: record['Quantity Avaliable '],
      parsedQty: parseNumeric(record['Quantity Avaliable ']),
      keys: Object.keys(record),
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
