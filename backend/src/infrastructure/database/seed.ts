import 'dotenv/config';
import { getDb } from './connection.js';
import { roles } from './schema/roles.js';
import { users } from './schema/users.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const db = getDb();

  console.log('Insertando roles...');
  const [adminRole, staffRole, clientRole] = await db.insert(roles).values([
    { name: 'ADMIN' },
    { name: 'STAFF' },
    { name: 'CLIENT' },
  ]).returning();

  console.log(`  ✓ ADMIN (id: ${adminRole.id})`);
  console.log(`  ✓ STAFF (id: ${staffRole.id})`);
  console.log(`  ✓ CLIENT (id: ${clientRole.id})`);

  const password = await bcrypt.hash('admin123', 10);

  console.log('Insertando usuario admin...');
  const [adminUser] = await db.insert(users).values({
    email: 'admin@smartspace.com',
    password,
    name: 'Admin',
    roleId: adminRole.id,
  }).returning();

  console.log(`  ✓ Admin user (id: ${adminUser.id}, email: admin@smartspace.com, password: admin123)`);

  console.log('\nSeed completado.');
}

seed().catch((err) => {
  console.error('Seed falló:', err);
  process.exit(1);
});
