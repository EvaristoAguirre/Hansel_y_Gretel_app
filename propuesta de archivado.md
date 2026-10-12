# Propuesta de archivado

Fecha: **11/10/2026**.  
Alcance: qué datos conserva hoy el archivado, cuáles conviene agregar, cómo implementar la corrida al arrancar (punto 5.3 de `update-archivado-ordenes.md`), la transacción por orden (punto 5.4), el horario por variable de entorno y el registro de errores.  
Este documento es una propuesta. No modifica código.

El criterio de antigüedad pasa de 7 a **15 días**. El cron pasa de domingo 21:10 a **miércoles 16:30**, hora de Argentina, con la expresión y la zona leídas del entorno para poder cambiarlas sin otro deploy.

---

## 1. Respuesta corta

Hoy el job copia la cabecera de la orden, sus importes, el id de mesa, el id de caja, los ítems (precio, cantidad, subtotal, comanda, toppings y promociones en JSON) y los pagos. No guarda el nombre del producto, el comentario del ítem, el nombre de la mesa ni el día de caja. Esos cuatro son los que hacen útil el archivo cuando el producto se renombra, la mesa cambia de nombre o se lee el JSON sin abrir el resto de la base.

La corrida al arrancar y el miércoles 16:30 deben llamar al **mismo** método. La selección deja de ser “la semana calendario anterior” y pasa a ser: estado `closed` o `cancelled`, y `date` anterior al inicio del día de hoy en `America/Argentina/Buenos_Aires`, menos 15 días.

Cada orden se inserta y se borra en **su propia** transacción. Si una falla, se deshace solo esa y se sigue con la siguiente. Un fallo de esquema (columna que no existe) aborta la corrida entera antes de borrar nada.

Los errores van a dos lugares que ya existen en el proyecto: el archivo diario de `LoggerService` (`backend/logs/AAAA/MM/`, ignorado por git) y dos tablas chicas de control. El directorio `logs` del repositorio no se commitea. La consola de Nest no alcanza: en la notebook del local se pierde al cerrar la terminal.

---

## 2. Qué se archiva hoy y qué no

Fuente: `backend/src/Order/services/archive.service.ts`, comparado con `order.entity.ts`, `order_details.entity.ts`, `order_payment.entity.ts`, `order_details_toppings.entity.ts` y `order-promotion-selection.entity.ts`. El JSON `backend/backups/archived-orders/archived-orders-2026-03-02.json` muestra el resultado real de una corrida (60 órdenes). Ese archivo es anterior al descuento (el código de `discountPercent` entró el 24/03/2026); el mapeo actual sí copia descuento e `isActive` del ítem.

### 2.1 Cabecera (`orders` → `archived_orders`)

| Dato en `orders` | ¿Se copia? | Notas |
| --- | --- | --- |
| `id` | Sí | Mismo UUID. Hay que conservarlo: la propuesta de facturación ARCA identifica la orden por ese id. |
| `date` | Sí | Fecha de apertura (`new Date()` al crear). El filtro del job usa esta columna, no `closedAt`. |
| `state` | Sí | |
| `total`, `tip`, `discountPercent`, `discountAmount` | Sí | Descuento desde el código del 24/03/2026. |
| `numberCustomers`, `comment` | Sí | |
| `createdAt`, `updatedAt`, `closedAt` | Sí | El JSON del 02/03/2026 conserva los valores originales de la orden, no la hora del archivado. |
| `table` → `tableId` | Sí, solo el UUID | Puede quedar null. |
| `dailyCash` → `dailyCashId` | Sí, solo el UUID | Puede quedar null. |
| `payments` | Sí, en `archived_order_payments` | Ver sección 2.3. |
| `methodOfPayment` de la cabecera | Solo si hay exactamente un pago | En pagos partidos queda null. El detalle está en la tabla de pagos. |
| `commandNumber` de la cabecera | Siempre null | `Order` no tiene ese campo. El servicio hace `(order as any).commandNumber`. La columna en `archived_orders` es `UNIQUE`: varios null están permitidos en PostgreSQL. La comanda real vive en cada ítem. |
| `isActive` de la orden | No | |

`archivedAt` existe solo dentro del JSON de respaldo. La tabla no tiene columna con el momento del traslado.

### 2.2 Ítems (`order_details` → `archived_order_details`)

| Dato | ¿Se copia? | Notas |
| --- | --- | --- |
| `id`, `quantity`, `unitaryPrice`, `subtotal`, `toppingsExtraCost` | Sí | |
| `commandNumber` | Sí | En el JSON aparece como `Comanda impresa: 20260222-0874`. |
| `isActive` | Sí, en el código actual | El JSON de marzo no lo trae: la columna se agregó después. |
| `product` → `productId` | Sí, solo el UUID | La columna archivada es `NOT NULL`. Si `product` es null, el `INSERT` de todo el lote falla hoy. |
| Nombre del producto, código, categoría | No | |
| `commentOfProduct` | No | Es el comentario que se imprime en la comanda. |
| Toppings | Sí, como JSON | `toppingId`, `toppingName`, `unitOfMeasureName`, `unitIndex`, `extraCost`. No se guarda el id de la unidad de medida; el nombre alcanza. |
| Promociones | Sí, como JSON | `slotId`, `selectedProductId`, `selectedProductName`, `extraCostApplied`. El nombre del slot (`promotion_slots.name`, por ejemplo "Bebida") no se copia, aunque la relación `slot` ya se carga. |

En el JSON del 02/03 hay un ítem con `toppingsExtraCost` de 1700 y `toppings: []`. El monto del extra quedó; la composición, no. Conviene registrar esa combinación como advertencia y archivar igual: el costo ya está en la columna.

### 2.3 Pagos (`order_payments` → `archived_order_payments`)

Se copian `amount`, `methodOfPayment` y `createdAt`. El `id` del pago original no se asigna: TypeORM genera otro UUID al insertar (el id que se ve en el JSON es el nuevo). Ningún módulo del código actual apunta a `order_payments.id`. Conservar el UUID original es barato y deja el archivo alineado con la fila viva.

### 2.4 Filas que el job no mueve

| Caso | Qué pasa |
| --- | --- |
| `open` | Queda en `orders`. |
| `pending_payment` | Hoy entra si cae en la ventana. En esta propuesta queda en `orders`. |
| `closed` y `cancelled` fuera de la ventana | Quedan en `orders`. Con la ventana de una semana, lo salteado no se recupera. |
| Orden `open` con `isActive = false` | `deleteOrder` solo apaga `isActive` y no cambia el estado. Esas filas no entran al archivo. Quedan fuera de esta pasada. |
| `cancelled` | Sí entra. `cancelOrder` pone `isActive = false` y `table = null` antes de guardar. El job no filtra `isActive`, y así tiene que seguir: si se agrega `isActive = true`, las canceladas no se archivan nunca. |

Las canceladas del JSON de marzo tienen `tableId` null, sin ítems y total 0. A la hora de archivar, el nombre de la mesa ya no está en la orden. Un snapshot de mesa en el job recupera las cerradas, que sí conservan la relación (`closeOrder` libera la mesa y no borra el vínculo).

### 2.5 Qué agregar, y qué dejar como está

Prioridad según el uso del archivo: leer una orden vieja, un JSON de respaldo o un reporte, sin depender de que el producto o la mesa sigan llamándose igual.

**Agregar en esta pasada** (foto al momento de archivar; no se reescriben filas ya archivadas, salvo un backfill best-effort indicado más abajo):

| Dónde | Campo nuevo | Por qué |
| --- | --- | --- |
| `archived_order_details` | `productName` | El id no dice qué se vendió si el producto se renombra o se desactiva. Las promociones ya guardan `selectedProductName`; el ítem principal, no. |
| `archived_order_details` | `productCode` | El código de 0 a 9999 es el que usa la comanda. Nullable: no todos los productos lo tienen. |
| `archived_order_details` | `categoryNames` (JSON de textos) | La categoría es muchos-a-muchos y también se renombra. Alcanza con los nombres. |
| `archived_order_details` | `commentOfProduct` | Es el texto que vio cocina. Sin eso, el archivo no reconstruye la comanda. |
| JSON `promotionSelections` | `slotName` | La relación `slot` ya se carga. No hace falta columna nueva: es una clave más dentro del JSON. Las filas viejas siguen válidas sin esa clave. |
| `archived_orders` | `tableName`, `roomName` | `tables.name` y `room.name`. El UUID no se lee en un reporte. En canceladas va a quedar null, porque la mesa ya se soltó al cancelar. |
| `archived_orders` | `dailyCashDate` | La fila de `daily_cash` no se borra, así que el id permite un join. El JSON de respaldo, solo, no. Guardar la fecha de esa caja lo hace autónomo. |
| `archived_orders` | `archivedAt` | Hoy ese instante solo está en el JSON. Hace falta en la tabla para saber qué corrida movió la orden. |
| `archived_order_payments` | conservar `id` | Mismo UUID que `order_payments`. Sin cambio de esquema. |

Esos campos nuevos van en una migración (como el resto del proyecto: `synchronize` está en `false`). Columnas nullable, para no romper filas ya archivadas. El job las llena de aquí en adelante.

**Dejar como está:**

- `isActive` de la cabecera. El estado `cancelled` o `closed` ya dice lo que importa.
- Totales de `daily_cash` (ventas, propinas, diferencias). Viven en la caja del día; copiarlos en cada orden los duplica y los deja viejos si la caja se corrige.
- Costo, stock e ingredientes del producto. No forman parte de la venta.
- Estado en vivo de la mesa.
- Id de la unidad de medida del topping. El nombre ya está en el JSON.
- `commandNumber` de la cabecera. No hay dato de origen. No rellenarlo con la comanda del ítem: la columna es única y dos órdenes pueden compartir el texto de comanda.

Backfill de nombres sobre filas ya archivadas: un `UPDATE` que joinee `products`, `tables` y `daily_cash` **después** de que el traslado nuevo esté probado. Es best-effort. Si el producto ya se renombró, el backfill escribe el nombre actual, no el de aquel día. Conviene una columna o un comentario de corrida que distinga “foto tomada al archivar” de “nombre rellenado después”. No mezclar ese `UPDATE` con la transacción que borra `orders`.

---

## 3. Horario y criterio de selección

Variables, todas con default. Un valor inválido usa el default y deja una línea de error. No hace falta un `ARCHIVE_ENABLED`: un cron mal escrito no debe apagar el job en silencio.

| Variable | Default | Uso |
| --- | --- | --- |
| `ARCHIVE_CRON` | `30 16 * * 3` | Minuto 30, hora 16, miércoles |
| `ARCHIVE_TIMEZONE` | `America/Argentina/Buenos_Aires` | Zona del cron y del corte de 15 días |
| `ARCHIVE_RETENTION_DAYS` | `15` | Antigüedad mínima de `date`. Entero ≥ 1. Si viene 0, negativo o texto, se usa 15. |
| `ARCHIVE_STARTUP_DELAY_MS` | `60000` | Espera tras el arranque antes de la corrida de recuperación |

`@Cron('10 21 * * 0')` evalúa la expresión al cargar la clase, antes de que `ConfigService` esté listo, y un cron inválido tira abajo el proceso. Registrar el job en `OnModuleInit` con `SchedulerRegistry` y `CronJob` (el paquete que ya usa `@nestjs/schedule`): leer `ConfigService`, validar la expresión, y si no es válida programar el default y loguear el valor rechazado. Pasar `timeZone` al `CronJob`. Así el miércoles 16:30 es hora de Argentina aunque el sistema operativo esté en UTC.

Criterio, calculado **una vez** al empezar la corrida:

- `state IN ('closed', 'cancelled')`
- `date` estrictamente anterior al inicio del día de hoy en `America/Argentina/Buenos_Aires`, menos `ARCHIVE_RETENTION_DAYS`

El corte conviene calcularlo en SQL para no depender de la zona del proceso Node:

```sql
SELECT (date_trunc('day', now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
        AT TIME ZONE 'America/Argentina/Buenos_Aires')
       - make_interval(days => 15);
```

No reinterpretar `date` ni `closedAt` al copiar. En el JSON del 02/03, `createdAt` y `date` de la misma orden difieren tres horas (el desfase de Argentina). Para un umbral de 15 días ese sesgo no cambia el resultado de fondo. Corregirlo dentro del traslado mezclaría una migración de datos con el archivado.

`getPreviousWeekRange` deja de usarse. Una orden cerrada hace un mes, que la ventana semanal ya no mira, entra en la primera corrida.

El miércoles a las 16:30 el local puede estar abierto. Con 15 días de antigüedad el job solo bloquea filas `closed` o `cancelled` viejas, no la orden que se está cobrando. La garantía de “la notebook estaba apagada” la da la corrida al arrancar, no el día de la semana.

---

## 4. Punto 5.3 — Corrida de recuperación al arrancar

### 4.1 Cuándo

`ArchiveService` implementa `OnApplicationBootstrap` (el mismo gancho que ya usa `SeederService`, cuando la base ya responde).

1. Esperar `ARCHIVE_STARTUP_DELAY_MS` (default 60 segundos) con un timer. No bloquear el bootstrap: la API ya está escuchando.
2. Llamar a `run('startup')`.
3. El cron del miércoles llama a `run('cron')`.

Un arranque de lunes, o de cualquier mañana en que el miércoles no hubo proceso, archiva el backlog de más de 15 días. Encender la notebook varias veces el mismo día es seguro: la segunda corrida no encuentra candidatas, o encuentra solo las que la anterior dejó por error.

### 4.2 Una sola corrida a la vez

Hace falta un lock de sesión de Postgres, no solo una bandera en memoria. La bandera cubre cron y arranque dentro del mismo proceso. El lock cubre dos procesos si alguien reinicia mientras la corrida anterior sigue viva.

El lock advisory es de **sesión**. Hay que tomarlo y soltarlo en el mismo `QueryRunner`, y no devolver esa conexión al pool hasta el final:

1. `createQueryRunner()` + `connect()`.
2. `SELECT pg_try_advisory_lock(874210)`. Si devuelve false: loguear “ya hay una corrida en curso”, soltar el runner y salir. No esperar. El arranque de la API no queda colgado.
3. Recién ahí, el bucle de órdenes, usando **ese** runner.
4. En `finally`: `pg_advisory_unlock(874210)` y `release()`.

Elegir los ids candidatos una sola vez, ordenados por `date`, antes del bucle. Una orden que se cierre durante la corrida espera a la próxima. No se carga el backlog entero con relaciones: pueden ser meses de órdenes acumuladas desde marzo.

### 4.3 Tabla de control

Migración nueva, aparte de las columnas de la sección 2.5.

`archive_runs`:

| Columna | Uso |
| --- | --- |
| `id` | UUID |
| `startedAt`, `finishedAt` | |
| `trigger` | `startup` o `cron` |
| `status` | `running`, `success`, `partial`, `failed`, `interrupted` |
| `archivedCount`, `skippedCount`, `repairedCount` | |
| `errorSummary` | Texto corto. El detalle por orden va en la otra tabla |

Al empezar, insertar `running`. Al terminar, `success` (cero omitidas) o `partial` (hubo omitidas y también archivadas) o `failed` (no se archivó ninguna y el error es de corrida: esquema, conexión, lock). Si el proceso muere, la sesión suelta el advisory lock. La corrida siguiente marca como `interrupted` toda fila `running` con `startedAt` de más de 15 minutos y sigue. Una fila `running` reciente, con el lock tomado, indica que la otra corrida sigue: no tocarla.

La tabla no decide qué órdenes entran. Eso lo decide el `SELECT` de la sección 3. Sirve para ver la última corrida buena y para no depender del archivo de log.

---

## 5. Punto 5.4 — Una transacción por orden

Se elimina el `while` de 3 intentos sobre el lote completo y el `dataSource.transaction` único. Un reintento del lote volvería a insertar órdenes que ya commitearon. El reintento, si hace falta, es de **esa** orden, como máximo dos veces, solo si el error es de conexión (`ECONNRESET`, `40001`, `40P01`). Un error de datos no se reintenta: va a fallar igual.

### 5.1 Antes de la primera orden

Comprobar columnas en `information_schema` (las que el código escribe hoy, más las de la sección 2.5 si esa migración ya se aplicó):

- `archived_orders`: `discountPercent`, `discountAmount`, `tip`, `commandNumber`, `closedAt`, y las nuevas `tableName`, `roomName`, `dailyCashDate`, `archivedAt`
- `archived_order_details`: `isActive`, `toppings`, `promotionSelections`, `toppingsExtraCost`, y las nuevas `productName`, `productCode`, `commentOfProduct`, `categoryNames`
- `archived_order_payments`: `amount`, `methodOfPayment`, `createdAt`

Si falta alguna: estado `failed`, una línea de log con la lista, **cero** `DELETE`. Los tres reintentos actuales repiten el mismo error y no aportan. Este chequeo reemplaza ese comportamiento para el fallo de esquema.

En la base del local, antes del deploy, siguen valiendo las consultas de la sección 4 de `update-archivado-ordenes.md`, más las migraciones `1742100000000`, `1761844619549`, `1761900003000` y `1768690674909`.

### 5.2 Dentro de la transacción de una orden

Misma conexión del lock. `startTransaction` / `commit` / `rollback` por orden. La conexión no se suelta entre órdenes.

1. `SELECT` de esa orden `FOR UPDATE`.
2. Volver a leer `state` y `date`. Si ya no cumple el criterio, `rollback` y seguir. Alguien pudo reabrirla entre el listado y el lock.
3. Si el `id` ya está en `archived_orders` (corrida cortada en un bug viejo, o reintento):
   - Contar ítems y pagos de los dos lados.
   - Si coinciden: borrar solo la fila viva y sus hijas (paso 7) y commitear. Contar como `repaired`. No insertar de nuevo.
   - Si no coinciden: `rollback`, log `CONFLICT` con el id, no borrar ninguno de los dos lados.
4. Si algún ítem tiene `product` null: `rollback`, log `NULL_PRODUCT` con el id de la orden y del ítem. No inventar un UUID. La orden queda en `orders`.
5. Insertar cabecera, ítems y pagos con los **mismos** UUID (orden, ítem y pago). Llenar los campos nuevos de la sección 2.5. `archivedAt = now()`. Copiar `createdAt`, `updatedAt` y `closedAt` tal cual están. El JSON de marzo muestra que, asignados antes del `save`, TypeORM los persistió; al tocar las entidades, mantener esas columnas como timestamp común y reservar `archivedAt` para el instante del traslado.
6. Comprobar, todavía dentro de la transacción, que la cantidad de ítems y de pagos archivados es igual a la de origen. Si no, `rollback`.
7. Borrar hijas y después la orden, en este orden, por id:
   - `order_detail_toppings` (la entidad no declara `onDelete: 'CASCADE'`)
   - `order_promotion_selections`
   - `order_payments`
   - `order_details`
   - `orders`

   El `remove` actual de TypeORM depende de traer todas las relaciones cargadas. Un topping no cargado deja el `DELETE` de `order_details` frenado por la FK, y hoy eso anula la semana. Borrar por id, en orden, no depende de eso. Conviene confirmar en la base del local:

   ```sql
   SELECT conrelid::regclass AS tabla, conname, confdeltype
   FROM pg_constraint
   WHERE contype = 'f'
     AND confrelid IN ('orders'::regclass, 'order_details'::regclass);
   ```

   `confdeltype = 'c'` es cascade; `'a'` es no action. El borrado explícito cubre los dos casos.

8. `commit`.

Un error en el paso 7 deshace el insert. La orden viva queda igual que antes de esa transacción.

No rechazar la orden porque el total no cierre con la suma de pagos. Eso es un descuadre histórico. El traslado tiene que ser fiel a lo que hay. El descuadre se loguea como advertencia y la orden se archiva. Frenarla la dejaría para siempre en `orders`.

`toppingsExtraCost > 0` con lista de toppings vacía: advertencia, y se archiva.

### 5.3 Qué garantiza esto sobre la base

- Ninguna orden se borra de `orders` si su copia no commiteó en la misma transacción.
- Una orden mala no deshace las que ya commitearon.
- Si el proceso muere a la mitad, lo commiteado está en `archived_orders` y el resto sigue en `orders`. La próxima corrida retoma por el criterio de 15 días. El caso “está en las dos tablas” lo cubre el paso 3, sin duplicar la clave primaria.
- El lock de sesión impide dos corridas borrando y insertando a la vez.
- El chequeo de columnas impide el fallo actual: un `INSERT` rechazado que, en el diseño viejo, hacía rollback de toda la semana.
- `open` y `pending_payment` no entran al `SELECT`.
- No se usa `synchronize: true`.

El JSON de respaldo se escribe **después** del commit, fuera de la transacción. Si el disco falla, la base ya quedó bien y solo se loguea el error de backup. El nombre actual `archived-orders-YYYY-MM-DD.json` pisa el archivo si hay dos corridas el mismo día (arranque a la mañana y cron a la tarde). Pasar a `archived-orders-YYYY-MM-DDTHH-mm-ss.json` dentro de `backend/backups/archived-orders/`.

---

## 6. Dónde dejar los logs de error

### 6.1 Archivo: el `logs` que ya usa el backend

`LoggerService` (`backend/src/Monitoring/monitoring-logger.service.ts`) escribe en:

- desarrollo, o producción sin `PATH_LOG`: `backend/logs/AAAA/MM/AAAA-MM-DD.log` (el `cwd` del proceso es `backend/`)
- producción con `PATH_LOG`: esa ruta

`backend/.gitignore` ignora `logs`. El README ya documenta `PATH_LOG=./logs`. El archivo del 11/10/2026 en `backend/logs/2026/10/` tiene arranques, login y apertura de caja. Ese es el lugar.

No crear un `logs/` en la raíz del repo ni commitear estos archivos. No hace falta un directorio nuevo: un prefijo fijo `[ARCHIVE]` permite filtrar con grep.

`ArchiveService` hoy usa `console.log` y el `Logger` de Nest. Eso sale por stdout y en la notebook no queda cuando se cierra la terminal. La corrida tiene que usar `LoggerService`, que ya es un módulo global.

El transporte rota a los 5 MB (`maxSize: '5m'`). Una corrida grande del backlog puede partirse en más de un archivo del mismo día. Por eso el id de cada orden fallida también va a la base.

### 6.2 Base: la lista de órdenes que no se movieron

`archive_order_errors`:

| Columna | Uso |
| --- | --- |
| `id` | UUID |
| `runId` | FK a `archive_runs` |
| `orderId` | La orden que sigue en `orders` |
| `attemptedAt` | |
| `reason` | `NULL_PRODUCT`, `CONFLICT`, `FK`, `ENUM`, `CONNECTION`, `OTHER` |
| `pgCode` | Código de Postgres si existe (`42703` columna ausente, `23502` not null, `23503` FK, `22P02` enum) |
| `message` | `error.message`, sin el JSON de la orden |

No guardar el cuerpo de la orden ni `comment` / `commentOfProduct` en esta tabla. Alcanza el id para ir a buscarla en `orders`.

Cada corrida, aunque archive cero órdenes, cierra con una línea `info`:

```text
[ARCHIVE] trigger=startup status=partial archived=120 skipped=2 repaired=0
```

Cada orden omitida, una línea `error` con id, `reason`, `pgCode` y mensaje. El fallo de esquema es una sola línea `error` y estado `failed`, sin una fila por orden.

Esas órdenes se reintentan en la corrida siguiente. Un `NULL_PRODUCT` o un `CONFLICT` va a repetirse: quedan visibles en el resumen y no se borran. Hace falta una persona para corregir el dato. No hace falta una tabla de “no reintentar”: esconderlas saca el problema de la vista.

El mail de `NotificationService` sigue con usuario y clave fijos, y no avisa. Esta pasada no depende de ese mail. El log de archivo y `archive_runs` son el aviso. El punto 5.5 del documento anterior (SMTP por entorno) puede hacerse después, leyendo el `errorSummary` de la última corrida `failed` o `partial`.

---

## 7. Orden de trabajo en la notebook del local

1. Backup de la base, antes de migrar y antes de la primera corrida con el criterio de 15 días. Esa corrida puede mover meses de órdenes en un solo arranque.
2. Correr las consultas de columnas y de FK de este documento y de la sección 4 de `update-archivado-ordenes.md`.
3. Aplicar migraciones pendientes y la migración nueva (columnas de la sección 2.5, `archive_runs`, `archive_order_errors`). Volver a contar columnas. Si falta alguna, no arrancar el job.
4. Recién ahí, el código: criterio de 15 días, cron por entorno, arranque, transacción por orden, `LoggerService`.
5. Encender el backend en horario cerrado la primera vez, para que la recuperación del backlog no comparta el equipo con el servicio. Comparar:

   ```sql
   SELECT
     (SELECT COUNT(*) FROM orders WHERE state IN ('closed', 'cancelled')) AS vivas_cerradas,
     (SELECT COUNT(*) FROM archived_orders) AS archivadas,
     (SELECT COUNT(*) FROM archive_order_errors) AS con_error;
   ```

   Una orden `closed` o `cancelled` con `date` de más de 15 días que siga en `orders` tiene que estar en `archive_order_errors`.
6. Abrir el log del día y buscar `[ARCHIVE]` con `status=success` o `status=partial`.
7. El miércoles siguiente, con la notebook prendida a las 16:30, tiene que aparecer otra línea. Si ese miércoles está apagada, la línea aparece al próximo arranque.

---

## 8. Criterio de listo

- `archived_orders` tiene las órdenes `closed` y `cancelled` con `date` anterior a hoy menos 15 días, incluidas las que quedaron en `orders` desde marzo.
- Cada una de esas filas permite leer nombre de producto, comentario del ítem, mesa (si seguía vinculada) y fecha de caja, sin adivinar por UUID.
- `open` y `pending_payment` siguen en `orders`.
- Apagar la notebook un miércoles no deja el lote varado: al próximo arranque se archiva.
- Una orden con `product` null, o con copia ya existente y conteos distintos, queda en `archive_order_errors` y en `backend/logs/`, y el resto se archiva.
- Una columna faltante deja la corrida en `failed` y no borra ninguna orden.
- El UUID de la orden y de los ítems no cambia.
