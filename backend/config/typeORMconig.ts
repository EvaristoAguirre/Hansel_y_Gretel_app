import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import { registerAs } from '@nestjs/config';
import * as path from 'path';
dotenvConfig({ path: '.env' });

const config = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  autoLoadEntities: true,
  synchronize: true,
  dropSchema: false,
  logging: ['errors'],
  schema: 'public',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: [path.join(__dirname, '..', 'dist', 'migration', '*{.ts,.js}')],
};
export default registerAs('typeorm', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
