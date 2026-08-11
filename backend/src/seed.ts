import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createUser, getUserByEmail } from './db';

dotenv.config();

// Demo accounts for local testing. Passwords are hashed before storage.
// These credentials are documented in the README under "Demo Credentials".
const DEMO_USERS: Array<{ email: string; password: string; role: 'user' | 'admin' }> = [
  { email: 'admin@demo.com', password: 'admin123', role: 'admin' },
  { email: 'user@demo.com', password: 'user123', role: 'user' },
];

function seed() {
  for (const u of DEMO_USERS) {
    const email = u.email.trim().toLowerCase();
    const existing = getUserByEmail(email);
    if (existing) {
      console.log(`User already exists, skipping: ${email}`);
      continue;
    }
    const passwordHash = bcrypt.hashSync(u.password, 10);
    createUser(email, passwordHash, u.role);
    console.log(`Created ${u.role} user: ${email}`);
  }
  console.log('Seeding complete.');
}

seed();