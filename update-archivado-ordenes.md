# Propuesta — Archivado de órdenes

Fecha del análisis: **28/09/2026**.  
Alcance: por qué `archived_orders` no recibe filas, cuándo corre el proceso y qué hay que cambiar.  
Este documento es una propuesta. No modifica código.

---

## 1. Respuesta corta

El archivado **no está apagado por una variable de entorno**. En `.env.example` y en el código no existe `ARCHIVE_ENABLED`, `CRON` ni nada equivalente. `NODE_ENV` afecta la impresión, no este job.

El proceso es un cron **dentro del proceso de NestJS**. Corre **solo si el backend está levantado el domingo a las 21:10**, hora local del sistema (en la notebook de la cafetería, Argentina, UTC−3). No recupera corridas perdidas al volver a encender el equipo.

Aunque el cron dispare, **solo mueve las órdenes de la semana calendario anterior** (domingo 00:00 a sábado 23:59). Lo que quedó afuera de esa ventana se queda en `orders` para siempre.

El último respaldo JSON exitoso del repositorio es del **02/03/2026 00:10 UTC** (domingo 01/03 a las 21:10 ART), con 60 órdenes. El **24/03/2026** el código empezó a insertar `discountPercent` y `discountAmount`. Esas columnas solo aparecen si se corrió la migración `1742100000000-AddOrderDiscountColumns`, y las migraciones **no se ejecutan al arrancar** (`migrationsRun` está comentado y `synchronize` está en `false`). Si esa migración no está aplicada en la base revisada, cada domingo la transacción falla entera, no se escribe ninguna fila y el aviso por mail no sale.

---

## 2. Cómo funciona hoy

Archivo: `backend/src/Order/services/archive.service.ts`.  
Registro: `ArchiveService` es provider de `OrderModule`. `ScheduleModule.forRoot()` está en `backend/src/app.module.ts`. El cron de prueba (`*/5 * * * *`) está comentado. El cron de producción está activo:

```ts
@Cron('10 21 * * 0') // minuto 10, hora 21, todos los meses, domingo
```

| Pieza | Comportamiento actual |
| --- | --- |
| Cuándo | Domingo 21:10, zona horaria del proceso Node (la del sistema operativo, salvo que exista `TZ`) |
| Dónde corre | En memoria, junto con la API. No hay cron del sistema ni cola |
| Reintentos | 3 intentos, 60 segundos entre cada uno, la misma corrida |
| Qué copia | Órdenes con `state` en `closed`, `cancelled` o `pending_payment` y `date` dentro de la semana anterior |
| Qué deja | Órdenes `open`. Órdenes de cualquier otra semana. Las del propio domingo en que corre el job |
| Escritura | Una sola transacción: inserta en `archived_orders` (y detalles y pagos) y borra las filas de `orders` |
| Respaldo | JSON en `backend/backups/archived-orders/` solo si la transacción commiteó y había al menos una orden |
| Aviso de fallo | `NotificationService` con usuario, clave y destinatario hardcodeados (`tu-contraseña-app`, `destinatario@gmail.com`). El mail no sale |

`date` se asigna al crear la orden (`new Date()` en `order.service.ts`). El filtro usa esa fecha de apertura, no `closedAt`.

### Ventana que calcula `getPreviousWeekRange`

El domingo a las 21:10:

- fin = sábado anterior a las 23:59:59.999
- inicio = ese sábado menos 6 días, a las 00:00:00.000 (el domingo anterior)

Los JSON guardados confirman esa ventana. El archivo del 02/03/2026 archivó órdenes con `date` entre el 22/02 (domingo) y el 28/02 (sábado). Las del domingo 01/03 quedaron para la semana siguiente.

### Evidencia de que el job sí corrió, y cuándo dejó de verse

| Archivo | `archivedAt` | Órdenes | Lectura |
| --- | --- | --- | --- |
| `archived-orders-2025-09-08.json` | 2025-09-08 00:10 UTC | 0 | El cron disparó y no encontró filas. No escribe JSON con contenido útil |
| `archived-orders-2026-01-19.json` | 2026-01-19 12:32 UTC | 7 | Fuera de hora. Corrida manual o de prueba |
| `archived-orders-2026-01-26.json` … `2026-03-02.json` | cada lunes 00:10 UTC | 60 a 174 | Domingos 21:10 ART, en la notebook de la cafetería |

Esos JSON se generan **después** del commit. En esa base, hasta el 02/03/2026, `archived_orders` sí recibió filas. Un `archived_orders` vacío hoy corresponde a otra base, o a una base recreada después de esa fecha. Desde el deploy del 24/03/2026 el job puede estar fallando todas las semanas además de no reponer lo ya salteado.

---

## 3. Por qué la base revisada no muestra archivado

Causas ordenadas por el efecto que producen. Pueden convivir.

### 3.1 El proceso no está vivo a las 21:10 del domingo

La API corre en la notebook que enciende la encargada. `@nestjs/schedule` no ejecuta un cron vencido al arrancar. Si el domingo a las 21:10 el equipo está apagado, suspendido o el backend no está levantado, esa semana no existe para el job.

No hay variable que lo desactive. La ausencia de proceso es la condición.

### 3.2 La ventana de una semana no tiene recuperación

Un domingo perdido no se compensa el domingo siguiente. El job vuelve a mirar solo los siete días inmediatamente anteriores. Las órdenes cerradas de hace dos semanas, o de hace seis meses, siguen en `orders`.

Esto solo ya explica una tabla `orders` grande y un `archived_orders` que no crece, aunque el cron esté sano.

### 3.3 El insert falla entero desde el cambio de descuentos

Desde el commit del 24/03/2026 (`63be566`) `ArchiveService` persiste `discountPercent` y `discountAmount`. La migración que crea esas columnas en `orders` y en `archived_orders` es `backend/migration/1742100000000-AddOrderDiscountColumns.ts`.

En `backend/config/typeORMconfig.ts`:

- `synchronize: false`
- `migrationsRun` comentado

Si en la base revisada no se corrió esa migración, PostgreSQL rechaza el `INSERT` (`column "discountPercent" does not exist`). La transacción hace rollback de **todas** las órdenes de la semana, los tres reintentos fallan igual, y no queda rastro en `archived_orders`.

El mismo patrón aplica a cualquier columna agregada solo en la entidad. `isActive` en `archived_order_details` tiene migración (`1761900003000`). Conviene confirmar que también está aplicada.

### 3.4 Una sola orden defectuosa anula la semana

Todo el lote va en una transacción. Casos que abortan el lote completo:

- un detalle con `product` nulo: se copia `productId` con `detail.product?.id` y la columna en `archived_order_details` es `NOT NULL`
- un valor de `methodOfPayment` que no esté en el enum de PostgreSQL
- un `DELETE` de `orders` frenado por una FK sin `ON DELETE CASCADE`

El log de Nest queda en el proceso. El mail de `NotificationService` no avisa a nadie.

### 3.5 Estados que el job ignora o archiva de más

| Estado | Qué hace el job |
| --- | --- |
| `open` | No la toca. Si el local no cierra o no cancela, esa orden no se archiva nunca |
| `closed` y `cancelled` | Entran si caen en la ventana |
| `pending_payment` | También entra. Una orden todavía en cobro, abierta el domingo anterior, se copiaría y se borraría de `orders` |

`pending_payment` no explica una tabla vacía. Sí es un criterio incorrecto para cuando el job vuelva a funcionar.

### 3.6 Qué no es la causa

- No hay un flag de entorno mal asignado que desactive el archivado.
- `NODE_ENV=development` no saltea este cron.
- El cron de producción no está comentado.
- La zona horaria de la notebook, mientras siga en Argentina, coincide con los respaldos históricos (21:10 ART = 00:10 UTC). `TZ` solo importaría si el sistema estuviera en UTC u otra zona: movería la hora de disparo y los límites del domingo y del sábado.

---

## 4. Comprobaciones en la base y en los logs

Correr en la misma base que se revisó:

```sql
-- ¿La tabla existe y tiene filas?
SELECT COUNT(*) FROM archived_orders;

-- Columnas que el código actual intenta escribir
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'archived_orders'
  AND column_name IN ('discountPercent', 'discountAmount', 'tip', 'commandNumber');

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'archived_order_details'
  AND column_name = 'isActive';

-- Backlog que el cron semanal ya no va a mirar
-- (ajustar el rango al domingo–sábado inmediatamente anteriores)
SELECT state, COUNT(*)
FROM orders
GROUP BY state
ORDER BY state;
```

En los logs del backend, los domingos cerca de las 21:10, buscar:

- `Intento 1 de 3, archivando órdenes...`
- `Archivadas N órdenes en la base de datos`
- `Intento N fallido:`

Si no aparece ninguna de esas líneas, el proceso no estaba arriba. Si aparece el fallo y el mensaje habla de `discountPercent`, la migración no está aplicada.

---

## 5. Propuesta de cambio

Objetivo: que toda orden `closed` o `cancelled` con más de siete días termine en `archived_orders`, aunque la notebook haya estado apagada uno o varios domingos, y que un fallo quede visible y no borre el lote entero.

### 5.1 Poner al día el esquema antes de tocar el job

Aplicar las migraciones pendientes en la base del local, en particular `1742100000000-AddOrderDiscountColumns` y `1761900003000-AddIsActiveToArchivedOrderDetails`. Sin esas columnas el job actual no puede insertar.

Verificar con las consultas de la sección 4. Recién después, un backfill.

### 5.2 Cambiar el criterio de selección

Reemplazar “la semana calendario anterior” por:

- `state IN ('closed', 'cancelled')`
- `date < inicio del día de hoy menos 7 días` (hora de `America/Argentina/Buenos_Aires`)

Sacar `pending_payment` del criterio. Esas órdenes siguen en caja.

Así, el primer domingo —o el primer arranque— después del cambio arrastra todo el backlog, no solo siete días.

Fijar la zona en el cron:

```ts
@Cron('10 21 * * 0', { timeZone: 'America/Argentina/Buenos_Aires' })
```

### 5.3 Corrida de recuperación al arrancar

Además del domingo a las 21:10, ejecutar el mismo método al iniciar el backend, con un retardo corto para no competir con el arranque de la API.

Si la notebook se enciende el lunes, el backlog de la semana que el domingo no corrió se archiva igual. El domingo de las 21:10 queda como segunda oportunidad, no como única.

Guardar la última corrida exitosa (tabla chica o una fila de control) con fecha, cantidad archivada y error si lo hubo.

### 5.4 Una transacción por orden

Por cada orden candidata:

1. Insertar cabecera, detalles y pagos.
2. Borrar la orden original.
3. Commit.

Si una orden falla (`productId` nulo, enum, FK), se registra y se sigue con la siguiente. Al final, log con archivadas y omitidas.

Si `product` es nulo, no inventar un UUID: dejar la orden en `orders` y loguear su id.

### 5.5 Aviso que sí salga

Sacar de `notification.service.ts` el usuario, la clave y el destinatario fijos. Leerlos de entorno (`SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL`). Si no están definidos, no intentar enviar: dejar el error solo en el log, con nivel `error`, incluyendo el mensaje de Postgres.

Variables nuevas, todas opcionales, con default que **no apague** el job:

| Variable | Default | Uso |
| --- | --- | --- |
| `ARCHIVE_CRON` | `10 21 * * 0` | Expresión cron |
| `ARCHIVE_TIMEZONE` | `America/Argentina/Buenos_Aires` | Zona del cron y de la ventana |
| `ARCHIVE_RETENTION_DAYS` | `7` | Antigüedad mínima de `date` |
| `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL` | vacías | Aviso solo si las tres tienen valor |

No agregar `ARCHIVE_ENABLED=false` como forma de “arreglar” el local. El problema actual es la ausencia de corridas efectivas, no un flag activo.

### 5.6 Backfill único del historial acumulado

Script o endpoint interno, ejecutado una vez a propósito, que use el mismo método de la sección 5.2 sobre todas las `closed` y `cancelled` con `date` anterior al umbral. Corrida en horario cerrado, con el conteo de antes y después:

```sql
SELECT
  (SELECT COUNT(*) FROM orders WHERE state IN ('closed', 'cancelled')) AS vivas,
  (SELECT COUNT(*) FROM archived_orders) AS archivadas;
```

El JSON de respaldo se mantiene, escrito por lote o por día, fuera de la transacción, como ahora.

### 5.7 Qué no cambiar en esta pasada

- El UUID de la orden se conserva al archivar (la propuesta de facturación ARCA depende de ese id).
- No archivar órdenes `open`.
- No volver a `synchronize: true`.

---

## 6. Orden de trabajo sugerido

1. Confirmar en la base del local las consultas de la sección 4 y una línea de log de un domingo reciente.
2. Aplicar migraciones pendientes y volver a contar columnas.
3. Cambiar selección, zona horaria, transacción por orden y corrida al arrancar.
4. Correr el backfill una vez y comparar conteos.
5. Dejar el aviso por mail solo cuando las variables SMTP estén cargadas.
6. El domingo siguiente, verificar una línea `Archivadas N` y que las órdenes de más de siete días ya no estén en `orders`.

---

## 7. Criterio de listo

- `archived_orders` contiene las órdenes `closed` y `cancelled` con más de siete días, incluidas las anteriores a marzo de 2026 que sigan en `orders`.
- Un domingo con la notebook apagada no deja ese lote varado: al próximo arranque se archiva.
- Una orden con datos incompletos queda registrada y no impide archivar el resto.
- El fallo de esquema (columna ausente) aparece en el log con el mensaje de Postgres.
- `pending_payment` y `open` siguen en `orders`.
