# Checklist para pasar a Producción - NestJS + TypeORM + PostgreSQL

Este documento contiene los pasos y buenas prácticas para preparar tu aplicación antes de desplegarla en producción.

---

## 1. Variables de entorno

- Configurar correctamente las variables para la base de datos:

  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB`

- Usar un archivo `.env.production` o la gestión segura de variables que soporte tu plataforma de despliegue.

- No subir archivos `.env` al repositorio (verificar `.gitignore`).

---

## 2. Configuración de TypeORM (`typeorm.config.ts`)

| Configuración      | Desarrollo             | Producción            |
| ------------------ | ---------------------- | --------------------- |
| `synchronize`      | `true`                 | `false`               |
| `dropSchema`       | `false`                | `false`               |
| `logging`          | `['errors']` o `'all'` | `['error']` o `false` |
| `migrationsRun`    | `false`                | `true`                |
| `autoLoadEntities` | `true`                 | `true`                |

**Ejemplo de configuración para producción:**

```ts
export default registerAs('typeorm', () => ({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  autoLoadEntities: true,
  synchronize: false,
  dropSchema: false,
  logging: ['error'],
  migrationsRun: true,
  schema: 'public',
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migration/*{.ts,.js}'],
}));
```
