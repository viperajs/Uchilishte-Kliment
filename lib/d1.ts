// Minimal D1-style API over libSQL (Turso in production, a local SQLite file in development),
// so the existing prepare().bind().first()/all()/run() and batch() queries work unchanged.
import { createClient, type Client, type InValue, type ResultSet } from '@libsql/client';

type Result<T> = { results: T[]; meta: { changes: number } };

const toResult = <T>(r: ResultSet): Result<T> => ({
  results: r.rows.map(row => Object.fromEntries(r.columns.map((c, i) => [c, row[i]])) as T),
  meta: { changes: r.rowsAffected },
});

export class Statement {
  constructor(private client: Client, readonly sql: string, readonly args: InValue[] = []) {}
  bind(...args: InValue[]) { return new Statement(this.client, this.sql, args); }
  async all<T = Record<string, unknown>>() { return toResult<T>(await this.client.execute({ sql: this.sql, args: this.args })); }
  async first<T = Record<string, unknown>>() { return (await this.all<T>()).results[0] ?? null; }
  async run<T = Record<string, unknown>>() { return this.all<T>(); }
}

export class Database {
  constructor(private client: Client) {}
  prepare(sql: string) { return new Statement(this.client, sql); }
  async batch<T = Record<string, unknown>>(statements: Statement[]) {
    const results = await this.client.batch(statements.map(s => ({ sql: s.sql, args: s.args })), 'write');
    return results.map(r => toResult<T>(r));
  }
}

let instance: Database | undefined;
export function database() {
  if (!instance) {
    const url = process.env.TURSO_DATABASE_URL || (process.env.VERCEL ? '' : 'file:.data/local.db');
    if (!url) throw new Error('TURSO_DATABASE_URL is not set.');
    instance = new Database(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }));
  }
  return instance;
}
