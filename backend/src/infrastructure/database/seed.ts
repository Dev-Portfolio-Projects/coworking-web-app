import 'dotenv/config';
import { getDb } from './connection.js';
import { roles } from './schema/roles.js';
import { users } from './schema/users.js';
import { amenities } from './schema/amenities.js';
import { spaces } from './schema/spaces.js';
import { spaceAvailability } from './schema/space_availability.js';
import bcrypt from 'bcryptjs';
import { eq, count } from 'drizzle-orm';

async function seed() {
  const db = getDb();

  const existingRoles = await db.select().from(roles);
  let adminRole = existingRoles.find(r => r.name === 'ADMIN');
  let staffRole = existingRoles.find(r => r.name === 'STAFF');
  let clientRole = existingRoles.find(r => r.name === 'CLIENT');

  if (!adminRole) {
    [adminRole] = await db.insert(roles).values({ name: 'ADMIN' }).returning();
    console.log('  ✓ ADMIN creado');
  } else {
    console.log('  ~ ADMIN ya existe');
  }
  if (!staffRole) {
    [staffRole] = await db.insert(roles).values({ name: 'STAFF' }).returning();
    console.log('  ✓ STAFF creado');
  } else {
    console.log('  ~ STAFF ya existe');
  }
  if (!clientRole) {
    [clientRole] = await db.insert(roles).values({ name: 'CLIENT' }).returning();
    console.log('  ✓ CLIENT creado');
  } else {
    console.log('  ~ CLIENT ya existe');
  }

  const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@workplace.com')).limit(1);
  if (existingAdmin.length === 0) {
    const password = await bcrypt.hash('admin123', 10);
    await db.insert(users).values({
      email: 'admin@workplace.com',
      password,
      name: 'Admin',
      roleId: adminRole!.id,
    });
    console.log('  ✓ admin@workplace.com / admin123');
  } else {
    console.log('  ~ admin@workplace.com ya existe');
  }

  const existingAmenities = await db.select().from(amenities);
  const existingNames = new Set(existingAmenities.map(a => a.name));
  const amenitiesToInsert = [
    { name: 'WiFi rápido', description: 'Conexión de alta velocidad' },
    { name: 'Café gratis', description: 'Café de especialidad ilimitado' },
    { name: 'Impresora', description: 'Impresión en blanco y negro y color' },
    { name: 'Estacionamiento', description: 'Estacionamiento privado gratuito' },
    { name: 'Aire acondicionado', description: 'Climatización central' },
    { name: 'Proyector', description: 'Proyector HD con pantalla' },
  ].filter(a => !existingNames.has(a.name));

  if (amenitiesToInsert.length > 0) {
    await db.insert(amenities).values(amenitiesToInsert);
    console.log(`  ✓ ${amenitiesToInsert.length} Recursos creados`);
  } else {
    console.log('  ~ Recursos ya existen');
  }

  const existingSpaces = await db.select().from(spaces);
  for (const space of existingSpaces) {
    const availabilityCount = await db
      .select({ value: count() })
      .from(spaceAvailability)
      .where(eq(spaceAvailability.spaceId, space.id));

    if (Number(availabilityCount[0]?.value ?? 0) > 0) continue;

    const slots = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
      slots.push(
        { availableDate: dateStr, startTime: '09:00', endTime: '11:00' },
        { availableDate: dateStr, startTime: '14:00', endTime: '16:00' },
      );
    }
    await db.insert(spaceAvailability).values(
      slots.map((slot) => ({ spaceId: space.id, ...slot })),
    );
    console.log(`  ✓ ${space.name}: 14 horarios de ejemplo en los próximos 7 días`);
  }

  console.log('\nSeed completado.');
}

seed().catch((err) => {
  console.error('Seed falló:', err);
  process.exit(1);
});
