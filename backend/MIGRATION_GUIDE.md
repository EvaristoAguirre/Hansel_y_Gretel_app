# Guía de Migraciones de Base de Datos

Este documento explica cómo usar el sistema de migraciones de TypeORM en el proyecto.

## 📋 Resumen de Cambios

### Nueva Funcionalidad: Timestamps de Órdenes

Se agregaron columnas de timestamp a las tablas `orders` y `archived_orders`:

- `createdAt`: Fecha y hora de creación (automático)
- `updatedAt`: Fecha y hora de última actualización (automático)
- `closedAt`: Fecha y hora de cierre (manual, nullable)

## 🚀 Comandos de Migración

### Scripts Principales

```bash
# Ejecutar migraciones pendientes
npm run migrate:run

# Revertir última migración
npm run migrate:revert

# Mostrar estado de migraciones
npm run migrate:show

# Generar nueva migración automática
npm run migration:generate -- migration/NombreDeLaMigracion

# Crear migración vacía
npm run migration:create -- migration/NombreDeLaMigracion
```

### Script Personalizado

```bash
# Usar el script personalizado con colores y validaciones
node scripts/migrate.mjs run
node scripts/migrate.mjs revert
node scripts/migrate.mjs show
node scripts/migrate.mjs generate NombreDeLaMigracion
node scripts/migrate.mjs create NombreDeLaMigracion
```

## 📁 Estructura de Archivos

```
backend/
├── migration/                          # Directorio de migraciones
│   └── 1761844619549-AddTimestampColumnsToOrders.ts
├── scripts/
│   └── migrate.mjs                     # Script personalizado de migración
├── config/
│   └── typeORMconig.ts                 # Configuración de TypeORM
└── package.json                        # Scripts de migración
```

## 🔧 Configuración

### Variables de Entorno Requeridas

Asegúrate de tener configuradas estas variables en tu archivo `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB=nombre_de_la_base_de_datos
```

### Configuración de TypeORM

El archivo `config/typeORMconig.ts` está configurado para:

- ✅ `synchronize: false` (producción)
- ✅ `dropSchema: false` (producción)
- ✅ Migraciones habilitadas
- ✅ Logging de errores y warnings

## 📝 Proceso de Migración

### 1. Preparación

```bash
# 1. Compilar el proyecto
npm run build

# 2. Verificar estado actual
npm run migrate:show
```

### 2. Ejecutar Migración

```bash
# Ejecutar migraciones pendientes
npm run migrate:run
```

### 3. Verificar Resultado

```bash
# Verificar que la migración se aplicó correctamente
npm run migrate:show
```

## 🔄 Migración Específica: Timestamps de Órdenes

### Archivo: `1761844619549-AddTimestampColumnsToOrders.ts`

**Cambios aplicados:**

1. **Tabla `orders`:**

   - ✅ `createdAt TIMESTAMP NOT NULL DEFAULT now()`
   - ✅ `updatedAt TIMESTAMP NOT NULL DEFAULT now()`
   - ✅ `closedAt TIMESTAMP` (nullable)

2. **Tabla `archived_orders`:**

   - ✅ `createdAt TIMESTAMP NOT NULL DEFAULT now()`
   - ✅ `updatedAt TIMESTAMP NOT NULL DEFAULT now()`
   - ✅ `closedAt TIMESTAMP` (nullable)

3. **Datos existentes:**
   - ✅ Los registros existentes se actualizan con `createdAt` y `updatedAt` basados en la columna `date`

### Rollback

Si necesitas revertir la migración:

```bash
npm run migrate:revert
```

## ⚠️ Consideraciones Importantes

### Antes de Ejecutar en Producción

1. **Backup de la base de datos:**

   ```bash
   pg_dump -h localhost -U usuario -d base_de_datos > backup_antes_migracion.sql
   ```

2. **Verificar conectividad:**

   ```bash
   npm run migrate:show
   ```

3. **Ejecutar en horario de bajo tráfico**

### Después de la Migración

1. **Verificar que la aplicación funciona correctamente**
2. **Probar la funcionalidad de timestamps en la interfaz**
3. **Verificar que las órdenes existentes tienen timestamps válidos**

## 🐛 Solución de Problemas

### Error: "Migration already exists"

```bash
# Verificar migraciones aplicadas
npm run migrate:show

# Si la migración ya está aplicada, no es necesario ejecutarla de nuevo
```

### Error: "Connection failed"

```bash
# Verificar variables de entorno
cat .env

# Verificar conectividad a la base de datos
psql -h localhost -U usuario -d base_de_datos
```

### Error: "Permission denied"

```bash
# Asegúrate de que el usuario de la base de datos tenga permisos de ALTER TABLE
GRANT ALL PRIVILEGES ON DATABASE nombre_base_datos TO tu_usuario;
```

## 📊 Verificación Post-Migración

### Verificar en la Base de Datos

```sql
-- Verificar estructura de la tabla orders
\d orders

-- Verificar que las columnas existen
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('createdAt', 'updatedAt', 'closedAt');

-- Verificar datos existentes
SELECT id, date, "createdAt", "updatedAt", "closedAt"
FROM orders
LIMIT 5;
```

### Verificar en la Aplicación

1. **Crear una nueva orden** y verificar que `createdAt` se establece automáticamente
2. **Actualizar una orden** y verificar que `updatedAt` se actualiza
3. **Cerrar una orden** y verificar que `closedAt` se establece
4. **Verificar en la interfaz de caja diaria** que se muestran los horarios

## 📚 Referencias

- [Documentación de TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Guía de Producción del Proyecto](./Checklist_production.md)
