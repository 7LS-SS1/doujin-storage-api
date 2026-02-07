import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

function getSQL(): ReturnType<typeof neon> {
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL!);
  }
  return _sql;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql = new Proxy((() => {}) as any, {
  apply(_target, _thisArg, args) {
    return getSQL()(...args);
  },
}) as ReturnType<typeof neon>;
