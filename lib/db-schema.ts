import { sql } from "./db";

type AltTitlesType = "jsonb" | "text_array";
type TableColumnsCacheEntry = {
  columns: Set<string>;
  expiresAt: number;
};

let cachedAltTitlesType: AltTitlesType | null = null;
const TABLE_COLUMNS_CACHE_TTL_MS = 30_000;
const tableColumnsCache = new Map<string, TableColumnsCacheEntry>();

export async function getComicsAltTitlesType(): Promise<AltTitlesType> {
  if (cachedAltTitlesType) return cachedAltTitlesType;

  try {
    const rows = await sql`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'comics' AND column_name = 'alt_titles'
      LIMIT 1
    `;
    const row = rows?.[0];
    const dataType = (row?.data_type as string | undefined) || "";
    const udtName = (row?.udt_name as string | undefined) || "";

    if (dataType.toLowerCase() === "array" || udtName === "_text") {
      cachedAltTitlesType = "text_array";
    } else {
      cachedAltTitlesType = "jsonb";
    }
  } catch {
    cachedAltTitlesType = "jsonb";
  }

  return cachedAltTitlesType;
}

export async function getTableColumns(tableName: string): Promise<Set<string>> {
  const cached = tableColumnsCache.get(tableName);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.columns;
  }

  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
  `;
  const columns = new Set<string>(
    (rows || []).map((row: { column_name: string }) => row.column_name)
  );
  tableColumnsCache.set(tableName, {
    columns,
    expiresAt: Date.now() + TABLE_COLUMNS_CACHE_TTL_MS,
  });
  return columns;
}

export async function tableHasColumn(
  tableName: string,
  columnName: string
): Promise<boolean> {
  const columns = await getTableColumns(tableName);
  return columns.has(columnName);
}
