// Applies drizzle/*.sql migrations once each. Uses Turso when TURSO_DATABASE_URL is set,
// otherwise the local development database in .data/local.db.
import { createClient } from '@libsql/client';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';

const url = process.env.TURSO_DATABASE_URL;
if (!url && process.env.VERCEL) {
  console.warn('TURSO_DATABASE_URL is not set: skipping migrations. The public pages will work; admin, uploads and the contact form need the database.');
  process.exit(0);
}
if (!url) mkdirSync('.data', { recursive: true });
const db = createClient({ url: url || 'file:.data/local.db', authToken: process.env.TURSO_AUTH_TOKEN });

await db.execute('CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied integer NOT NULL)');
const done = new Set((await db.execute('SELECT name FROM _migrations')).rows.map(r => r.name));
for (const name of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) {
  if (done.has(name)) continue;
  const statements = readFileSync(`drizzle/${name}`, 'utf8').split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  await db.batch([...statements, { sql: 'INSERT INTO _migrations (name, applied) VALUES (?, ?)', args: [name, Date.now()] }], 'write');
  console.log('Applied', name);
}
console.log('Database is up to date.');
