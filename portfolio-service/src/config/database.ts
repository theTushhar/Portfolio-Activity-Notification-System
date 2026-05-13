import { DataSource } from 'typeorm';
import { Transaction } from '../models/transaction.entity';

const rawDatabaseUrl = process.env.DATABASE_URL || '';
const parsedUrl = rawDatabaseUrl ? new URL(rawDatabaseUrl) : null;
const sslMode = parsedUrl?.searchParams.get('sslmode');
const useSsl = sslMode === 'require' || sslMode === 'verify-ca' || sslMode === 'verify-full';
if (parsedUrl && sslMode) {
  parsedUrl.searchParams.delete('sslmode');
}
const databaseUrl = parsedUrl ? parsedUrl.toString() : rawDatabaseUrl;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : false,
  synchronize: process.env.DB_SYNC === 'true',
  logging: process.env.NODE_ENV === 'development',
  entities: [Transaction],
  migrations: [],
  subscribers: []
});
