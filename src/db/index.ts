import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

// Create postgres connection
const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export schema for migrations
export { schema };

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connection...');
  await client.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing database connection...');
  await client.end();
  process.exit(0);
});
