#!/usr/bin/env node
// Run: node supabase/run-migration.mjs

import { readFileSync } from "fs";
import { Client } from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Try multiple connection strings in order
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error("✗ Missing DB_PASSWORD environment variable.");
  process.exit(1);
}

const CONNECTIONS = [
  // Session-mode pooler (supports DDL) - try multiple regions
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.yigudrrqqjvdbfjopgsu:${DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
  // Fallback: direct connection
  `postgresql://postgres:${DB_PASSWORD}@db.yigudrrqqjvdbfjopgsu.supabase.co:5432/postgres`,
];

import { readdirSync } from "fs";

const migrationDir = join(__dirname, "migrations");
const migrationFiles = readdirSync(migrationDir)
  .filter(f => f.endsWith(".sql"))
  .sort();

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
      console.log("✓ Connected! Running migrations...");

      for (const file of migrationFiles) {
        console.log(`  → Applying ${file}...`);
        const sql = readFileSync(join(migrationDir, file), "utf8");
        await client.query(sql);
      }

      console.log("✓ All migrations applied successfully!");
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
