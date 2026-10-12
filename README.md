# 🍰 Hansel y Gretel - Sistema de Gestión para Cafetería

Sistema integral de gestión para cafetería/restaurante que permite administrar pedidos, mesas, productos, ingredientes, stock, caja diaria y más. Desarrollado con **NestJS** (backend) y **Next.js** (frontend).

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Base de Datos](#-base-de-datos)
- [Comandos Principales](#-comandos-principales)
- [Documentación API](#-documentación-api)
- [Estructura del Proyecto](#-estructura-del-proyecto)

---

## 📖 Descripción

**Hansel y Gretel** es una aplicación de gestión completa para cafeterías y restaurantes que incluye:

- **Gestión de Mesas y Salones**: Control de mesas, estados y distribución por salones
- **Sistema de Pedidos**: Creación, edición, transferencia y cierre de pedidos
- **Gestión de Productos**: Productos simples, compuestos y promociones con toppings
- **Control de Stock e Ingredientes**: Seguimiento de inventario con alertas de stock bajo
- **Caja Diaria**: Apertura/cierre de caja, registro de movimientos, ingresos y egresos
- **Métricas y Reportes**: Estadísticas diarias, mensuales y anuales
- **Sistema de Roles**: Admin, Encargado, Mozo e Inventario
- **Impresión**: Comandas y tickets de venta
- **Exportación PDF**: Reportes de stock

---

## 🛠 Tecnologías

### Backend

- **NestJS** v10 - Framework Node.js
- **TypeORM** v0.3 - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **Socket.IO** - Comunicación en tiempo real
- **JWT** - Autenticación
- **Swagger** - Documentación de API
- **Winston** - Logging

### Frontend

- **Next.js** v15 - Framework React
- **Material UI** v6 - Componentes de UI
- **Zustand** - Gestión de estado
- **Recharts** - Gráficos
- **Socket.IO Client** - WebSockets

---

## 📦 Requisitos Previos

- **Node.js** >= 18.x
- **pnpm** >= 10
- **PostgreSQL** >= 14.x

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd Hansel_y_Gretel_app
```

### 2. Instalar dependencias del Backend

```bash
cd backend
pnpm install
```

### 3. Instalar dependencias del Frontend

```bash
cd ../frontend
pnpm install
```

### 4. Configurar variables de entorno

Crear archivo `.env` en la carpeta `backend/` (ver sección [Variables de Entorno](#-variables-de-entorno))

### 5. Configurar la base de datos

Ver sección [Base de Datos](#-base-de-datos)

### 6. Ejecutar migraciones

```bash
cd backend
pnpm run migration:run
```

### 7. Iniciar la aplicación

```bash
# Terminal 1 - Backend
cd backend
pnpm run start:dev

# Terminal 2 - Frontend
cd frontend
pnpm run dev
```

---

## 🔐 Variables de Entorno

Crear un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# ========================
# CONFIGURACIÓN DEL SERVIDOR
# ========================
NODE_ENV=development
PORT=3000
HOST=localhost

# ========================
# BASE DE DATOS (PostgreSQL)
# ========================
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña_segura
DB=hansel_gretel_db

# ========================
# AUTENTICACIÓN JWT
# ========================
JWT_SECRET=tu_clave_secreta_muy_segura_y_larga

# ========================
# LOGGING
# ========================
PATH_LOG=./logs

# ========================
# CORS (opcional)
# ========================
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

### Descripción de Variables

| Variable      | Descripción                    | Ejemplo                     |
| ------------- | ------------------------------ | --------------------------- |
| `NODE_ENV`    | Entorno de ejecución           | `development`, `production` |
| `PORT`        | Puerto del servidor backend    | `3000`                      |
| `HOST`        | Host del servidor              | `localhost`                 |
| `DB_HOST`     | Host de PostgreSQL             | `localhost`                 |
| `DB_PORT`     | Puerto de PostgreSQL           | `5432`                      |
| `DB_USER`     | Usuario de la base de datos    | `postgres`                  |
| `DB_PASSWORD` | Contraseña de la base de datos | `miPassword123`             |
| `DB`          | Nombre de la base de datos     | `hansel_gretel_db`          |
| `JWT_SECRET`  | Clave secreta para tokens JWT  | `mi_clave_secreta_123`      |
| `PATH_LOG`    | Ruta para archivos de log      | `./logs`                    |

---

## 🗄 Base de Datos

### Crear la Base de Datos

#### Opción 1: Usando psql (línea de comandos)

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE hansel_gretel_db;

# Crear un usuario específico (opcional pero recomendado)
CREATE USER hansel_user WITH PASSWORD 'tu_contraseña';

# Otorgar permisos
GRANT ALL PRIVILEGES ON DATABASE hansel_gretel_db TO hansel_user;

# Salir
\q
```

#### Opción 2: Usando pgAdmin

1. Abrir pgAdmin
2. Click derecho en "Databases" → "Create" → "Database"
3. Nombre: `hansel_gretel_db`
4. Owner: seleccionar el usuario deseado
5. Click en "Save"

### Ejecutar Migraciones

```bash
cd backend

# Ver migraciones pendientes
pnpm run migration:show

# Ejecutar migraciones
pnpm run migration:run

# Revertir última migración (si es necesario)
pnpm run migration:revert
```

### Generar Nueva Migración

```bash
# Generar migración basada en cambios de entidades
pnpm run migration:generate -- migration/NombreDeMigracion
```

### Estructura de la Base de Datos

La aplicación utiliza las siguientes tablas principales:

- `user` - Usuarios del sistema
- `product` - Productos y promociones
- `category` - Categorías de productos
- `ingredient` - Ingredientes y toppings
- `toppings_group` - Grupos de toppings
- `stock` - Control de inventario
- `unit_of_measure` - Unidades de medida
- `room` - Salones del local
- `table` - Mesas
- `order` - Pedidos
- `order_details` - Detalle de pedidos
- `daily_cash` - Caja diaria
- `cash_movement` - Movimientos de caja

---

## ⚡ Comandos Principales

### Backend (`/backend`)

| Comando                      | Descripción                                          |
| ---------------------------- | ---------------------------------------------------- |
| `pnpm run start:dev`          | Inicia el servidor en modo desarrollo con hot-reload |
| `pnpm run start:debug`        | Inicia en modo debug con hot-reload                  |
| `pnpm run build`              | Compila el proyecto para producción                  |
| `pnpm run start:prod`         | Inicia el servidor en modo producción                |
| `pnpm run start`              | Inicia el servidor sin watch                         |
| `pnpm run lint`               | Ejecuta ESLint para verificar código                 |
| `pnpm run lint:fix`           | Corrige errores de linting automáticamente           |
| `pnpm run format`             | Formatea código con Prettier                         |
| `pnpm run test`               | Ejecuta tests unitarios                              |
| `pnpm run test:watch`         | Ejecuta tests en modo watch                          |
| `pnpm run test:cov`           | Ejecuta tests con cobertura                          |
| `pnpm run test:e2e`           | Ejecuta tests end-to-end                             |
| `pnpm run migration:run`      | Ejecuta migraciones pendientes                       |
| `pnpm run migration:revert`   | Revierte última migración                            |
| `pnpm run migration:show`     | Muestra estado de migraciones                        |
| `pnpm run migration:generate` | Genera nueva migración                               |

### Frontend (`/frontend`)

| Comando         | Descripción                                    |
| --------------- | ---------------------------------------------- |
| `pnpm run dev`   | Inicia el servidor de desarrollo (puerto 3001) |
| `pnpm run build` | Compila el proyecto para producción            |
| `pnpm run start` | Inicia el servidor de producción (puerto 3001) |
| `pnpm run lint`  | Ejecuta linting del código                     |

### Desarrollo Completo

Para ejecutar toda la aplicación en desarrollo:

```bash
# Terminal 1 - Backend (puerto 3000)
cd backend
pnpm run start:dev

# Terminal 2 - Frontend (puerto 3001)
cd frontend
pnpm run dev
```

Acceder a:

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs

---

## 📚 Documentación API

La API está documentada con **Swagger/OpenAPI**. Una vez iniciado el backend, acceder a:

```
http://localhost:3000/api/docs
```

### Endpoints Principales

| Módulo          | Ruta Base         | Descripción                    |
| --------------- | ----------------- | ------------------------------ |
| Auth            | `/user`           | Autenticación (login/registro) |
| Products        | `/product`        | Gestión de productos           |
| Categories      | `/category`       | Categorías de productos        |
| Orders          | `/order`          | Gestión de pedidos             |
| Tables          | `/tables`         | Gestión de mesas               |
| Rooms           | `/room`           | Gestión de salones             |
| Ingredients     | `/ingredient`     | Ingredientes y toppings        |
| Stock           | `/stock`          | Control de inventario          |
| Daily Cash      | `/daily-cash`     | Caja diaria y métricas         |
| Unit of Measure | `/unitofmeasure`  | Unidades de medida             |
| Toppings Groups | `/toppings-group` | Grupos de toppings             |
| Printer         | `/printer`        | Impresión de tickets/comandas  |
| Export          | `/export`         | Exportación de reportes        |

---

## 📁 Estructura del Proyecto

```
Hansel_y_Gretel_app/
├── backend/                    # API NestJS
│   ├── config/                 # Configuración TypeORM
│   ├── migration/              # Migraciones de BD
│   ├── src/
│   │   ├── Category/           # Módulo de categorías
│   │   ├── daily-cash/         # Módulo de caja diaria
│   │   ├── Decorators/         # Decoradores personalizados
│   │   ├── DTOs/               # Data Transfer Objects
│   │   ├── Enums/              # Enumeraciones
│   │   ├── ExportPdf/          # Exportación PDF
│   │   ├── Filters/            # Filtros de excepciones
│   │   ├── Guards/             # Guards de autenticación
│   │   ├── Ingredient/         # Módulo de ingredientes
│   │   ├── Middleware/         # Middlewares
│   │   ├── Monitoring/         # Logging y monitoreo
│   │   ├── Order/              # Módulo de pedidos
│   │   ├── Printer/            # Módulo de impresión
│   │   ├── Product/            # Módulo de productos
│   │   ├── Real-time/          # WebSocket events
│   │   ├── Room/               # Módulo de salones
│   │   ├── Stock/              # Módulo de stock
│   │   ├── Table/              # Módulo de mesas
│   │   ├── ToppingsGroup/      # Módulo de grupos de toppings
│   │   ├── UnitOfMeasure/      # Módulo de unidades de medida
│   │   ├── User/               # Módulo de usuarios
│   │   ├── app.module.ts       # Módulo principal
│   │   └── main.ts             # Punto de entrada
│   └── package.json
│
├── frontend/                   # Aplicación Next.js
│   ├── api/                    # Servicios de API
│   ├── app/                    # Rutas y páginas
│   │   ├── context/            # Contextos de React
│   │   └── views/              # Vistas principales
│   ├── components/             # Componentes React
│   │   ├── Cafe/               # Vista principal del café
│   │   ├── DailyCash/          # Componentes de caja
│   │   ├── Order/              # Componentes de pedidos
│   │   ├── Products/           # Gestión de productos
│   │   ├── Table/              # Componentes de mesas
│   │   └── ...
│   ├── services/               # Servicios (WebSocket)
│   ├── styles/                 # Estilos globales
│   └── package.json
│
└── README.md                   # Este archivo
```

---

## 👥 Roles de Usuario

| Rol            | Permisos                                       |
| -------------- | ---------------------------------------------- |
| **ADMIN**      | Acceso total a todas las funcionalidades       |
| **ENCARGADO**  | Gestión de productos, caja, pedidos y reportes |
| **MOZO**       | Gestión de pedidos y mesas                     |
| **INVENTARIO** | Gestión de stock e ingredientes                |

---

## 🔧 Solución de Problemas

### Error de conexión a la base de datos

1. Verificar que PostgreSQL esté corriendo
2. Comprobar las credenciales en el archivo `.env`
3. Asegurar que la base de datos existe

### Error de migraciones

```bash
# Limpiar y regenerar
pnpm run build
pnpm run migration:run
```

### Puerto en uso

```bash
# En Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# En Linux/Mac
lsof -i :3000
kill -9 <PID>
```

---

## 📄 Licencia

Este proyecto es privado y de uso interno.

---

**Desarrollado con ❤️ para Hansel y Gretel Cafetería**
