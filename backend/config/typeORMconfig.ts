import { registerAs } from '@nestjs/config';
import * as path from 'path';
import { DataSource } from 'typeorm';
import 'dotenv/config';

export default registerAs('typeorm', () => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  autoLoadEntities: false,
  synchronize: false, // pasar a false en producción
  dropSchema: false, // pasar a false en producción
  logging: ['error', 'warn'],
  schema: 'public',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: [path.join(__dirname, '..', 'migration', '*{.ts,.js}')],

  // migrationsRun: true, // para activar las migraciones automáticamente al iniciar la aplicación
}));

export const connectionSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: [path.join(__dirname, '..', 'migration', '*{.ts,.js}')],
  schema: 'public',
  logging: ['error', 'warn'],
});
