#!/usr/bin/env node
// Small helper script to create or update an admin user using bcrypt and the project's pool helper.

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--name') out.name = args[++i];
    else if (a === '--email') out.email = args[++i];
    else if (a === '--password') out.password = args[++i];
    else if (a === '--phone') out.phone = args[++i];
    else if (a === '--role') out.role = args[++i];
  }
  return out;
}

(async function main() {
  const { name, email, password, phone, role } = parseArgs();
  if (!name || !email || !password) {
    console.error('Usage: node create_admin.js --name "Admin Name" --email admin@example.com --password "Secret123!" [--phone 2547...] [--role owner]');
    process.exit(1);
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    // Check if user exists
    const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    if (existing.rows && existing.rows.length > 0) {
      const id = existing.rows[0].id;
      await pool.query(
        `UPDATE users SET name = $1, password_hash = $2, role = $3, is_admin = TRUE, phone = $4 WHERE id = $5`,
        [name, hashed, role || 'owner', phone || null, id]
      );
      console.log(`Updated existing user id=${id} as admin (${email})`);
      process.exit(0);
    }

    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, loyalty, wallet_balance, role, is_admin, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [name, email, hashed, false, 0.0, role || 'owner', true, phone || null]
    );

    console.log(`Created admin user id=${res.rows[0].id} email=${email}`);
    process.exit(0);
  } catch (err) {
    console.error('Create admin error:', err);
    process.exit(2);
  }
})();
