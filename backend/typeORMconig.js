"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionSource = void 0;
const config_1 = require("@nestjs/config");
const path = require("path");
const typeorm_1 = require("typeorm");
require("dotenv/config");
exports.default = (0, config_1.registerAs)('typeorm', () => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    autoLoadEntities: true,
    synchronize: true,
    dropSchema: true,
    logging: ['error', 'warn'],
    schema: 'public',
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: [path.join(__dirname, '..', 'dist', 'migration', '*{.ts,.js}')],
}));
exports.connectionSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: [path.join(__dirname, '..', 'dist', 'migration', '*{.ts,.js}')],
    schema: 'public',
    logging: ['error', 'warn'],
});
//# sourceMappingURL=typeORMconig.js.map