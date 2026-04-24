export function parseNumeric(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;

  const rawValue = String(value).trim();
  if (!rawValue) return fallback;

  const numericMatch = rawValue.match(/-?\d+(?:\.\d+)?/);
  const normalized = numericMatch ? numericMatch[0] : '';

  if (!normalized) return fallback;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseInteger(value, fallback = 0) {
  return Math.trunc(parseNumeric(value, fallback));
}

export function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  return ['true', 'yes', '1', 'y'].includes(normalized);
}

export function splitTags(value) {
  return String(value ?? '')
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function splitLocations(value) {
  const entries = String(value ?? '')
    .split(/and|\+|,/i)
    .map((entry) => entry.trim())
    .filter(Boolean);

  let lastPrefix = '';

  return entries.map((entry) => {
    if (/^unit\s*\d+/i.test(entry)) {
      const prefixMatch = entry.match(/^(unit)\s*/i);
      lastPrefix = prefixMatch ? prefixMatch[1] : 'Unit';
      return entry.replace(/\s+/g, ' ');
    }

    if (/^\d+$/.test(entry) && lastPrefix) {
      return `${lastPrefix} ${entry}`;
    }

    return entry;
  });
}

export function normalizeName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toIsoDate(value) {
  const stringValue = String(value ?? '').trim();
  if (!stringValue) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) return stringValue;

  const parts = stringValue.split(/[./-]/);
  if (parts.length === 3) {
    let [day, month, year] = parts;
    if (year.length === 2) year = `20${year}`;
    if (year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  const parsed = new Date(stringValue);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}
