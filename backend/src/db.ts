import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '..', '..', 'data', 'app.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );
`);

export interface UserRow {
  id: number;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

export function createUser(email: string, passwordHash: string, role: 'user' | 'admin') {
  return db
    .prepare('INSERT OR IGNORE INTO users (email, passwordHash, role) VALUES (?, ?, ?)')
    .run(email, passwordHash, role);
}

export default db;
