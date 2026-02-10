import { sql } from "./db";

type AltTitlesType = "jsonb" | "text_array";

let cachedAltTitlesType: AltTitlesType | null = null;
const tableColumnsCache = new Map<string, Set<string>>();

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
  if (cached) return cached;

  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
  `;
  const columns = new Set<string>(
    (rows || []).map((row: { column_name: string }) => row.column_name)
  );
  tableColumnsCache.set(tableName, columns);
  return columns;
}

export async function tableHasColumn(
  tableName: string,
  columnName: string
): Promise<boolean> {
  const columns = await getTableColumns(tableName);
  return columns.has(columnName);
}
