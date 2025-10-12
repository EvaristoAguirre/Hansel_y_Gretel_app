import { registerAs } from '@nestjs/config';
import { DataSource } from 'typeorm';
import 'dotenv/config';

const isCompiled = __dirname.includes('dist');

const entitiesPath = isCompiled
  ? [__dirname + '/../**/*.entity.js']
  : [__dirname + '/../src/**/*.entity.ts'];

const migrationsPath = isCompiled
  ? [__dirname + '/../migrations/*.js']
  : [__dirname + '/../migrations/*.ts'];

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
  entities: entitiesPath,
  migrations: migrationsPath,
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
  entities: entitiesPath,
  migrations: migrationsPath,
});
