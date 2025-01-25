import { DataSource, DataSourceOptions } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import { registerAs } from '@nestjs/config';
import * as path from 'path';
dotenvConfig({ path: '.env' });

const config = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'sam',
  password: 'mysamword',
  database: 'hansel_y_gretel',
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
