import { pool } from '../src/db/pool.js';

async function main() {
  const sql = `
    update consumables c
    set source_locations = src.locations
    from (
      select normalized_name, array_agg(distinct location_value order by location_value) as locations
      from (
        select
          lower(trim(regexp_replace(raw_data->>'name', '\\s+', ' ', 'g'))) as normalized_name,
          jsonb_array_elements_text(raw_data->'locations') as location_value
        from import_rows
        where raw_data ? 'locations'
      ) extracted
      group by normalized_name
    ) src
    where c.normalized_name = src.normalized_name
  `;

  await pool.query(sql);

  const result = await pool.query(
    'select name, source_locations from consumables where cardinality(source_locations) > 0 order by id limit 10'
  );

  console.log(JSON.stringify(result.rows, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
