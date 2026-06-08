#!/usr/bin/env node
// Run: node supabase/run-migration.mjs

import { readFileSync } from "fs";
import { Client } from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try multiple connection strings in order
const CONNECTIONS = [
  // Session-mode pooler (supports DDL) - try multiple regions
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:8SMp%2F%21pAWkYKWbz@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:8SMp%2F%21pAWkYKWbz@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:8SMp%2F%21pAWkYKWbz@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:8SMp%2F%21pAWkYKWbz@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
  // Fallback: direct connection
  `postgresql://postgres:8SMp%2F%21pAWkYKWbz@db.yigudrrqqjvdbfjopgsu.supabase.co:5432/postgres`,
];

const sql = readFileSync(join(__dirname, "migrations/001_initial_schema.sql"), "utf8");

async function run() {
  for (const connStr of CONNECTIONS) {
    const display = connStr.replace(/:[^:@]+@/, ":***@");
    console.log(`\nTrying: ${display}`);
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      console.log("✓ Connected! Running migration...");
      await client.query(sql);
      console.log("✓ Migration applied successfully!");
      await client.end();
      return;
    } catch (err) {
      console.error(`✗ ${err.message}`);
      try { await client.end(); } catch {}
    }
  }
  console.error("\n✗ All connections failed.");
  process.exit(1);
}

run();
