import { registerAs } from '@nestjs/config';
import * as path from 'path';
import { DataSource } from 'typeorm';
import 'dotenv/config';

// Detecta si estás en modo producción o desarrollo
const isCompiled = __dirname.includes('dist');

// Define las rutas de entidades y migraciones dinámicamente
const entitiesPath = isCompiled
  ? path.join(__dirname, '..', '**', '*.entity{.js}')
  : path.join(__dirname, '..', 'src', '**', '*.entity{.ts,.js}');

const migrationsPath = isCompiled
  ? path.join(__dirname, '..', 'migrations', '*{.js}')
  : path.join(__dirname, '..', 'migrations', '*{.ts,.js}');

export default registerAs('typeorm', () => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  schema: 'public',
  autoLoadEntities: false,
  synchronize: false,
  dropSchema: false,
  logging: ['error', 'warn'],
  entities: [entitiesPath],
  migrations: [migrationsPath],
}));

export const connectionSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  schema: 'public',
  logging: ['error', 'warn'],
  entities: [entitiesPath],
  migrations: [migrationsPath],
});
