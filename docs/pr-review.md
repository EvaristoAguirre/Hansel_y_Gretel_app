# PR Review: fix-fase-4-higiene

**Fecha:** 2026-09-24  
**Rama base:** development (`origin/development`)  
**Merge-base:** `5377cd9`  
**Commits incluidos:** 1 (`e620725`)  
**Archivos modificados (reales, vía merge-base):** 41

La rama también contiene el historial que ya está en `development` y no está en `origin/main` (fases 0–3). `origin/main` existe y el algoritmo por defecto lo elegiría primero, pero esta rama está exactamente **1 commit adelante de `development` y 0 atrás**. El review usa `origin/development...HEAD` para no mezclar trabajo ya integrado. No hace falta traer la base antes de mergear a `development`.

## Resumen ejecutivo

El PR cierra la fase 4: JWT en el handshake de Socket.IO, eventos de stock con cantidad para el front, contador de comanda en Postgres y un bump de dependencias (Next 15.5.26, Nest 10.4.22, overrides de `socket.io-parser` y `ws`). La auth del socket y el corte de emisión de stock hasta después del commit están bien encaminados. Hay que corregir cómo el front aplica esas cantidades, el corte del contador de comanda en el primer deploy y el lockfile de pnpm, que no refleja el bump de Next.

## Patrones del proyecto detectados

| Aspecto | Patrón detectado |
|---------|-----------------|
| ORM/DB | TypeORM + PostgreSQL. `synchronize: false`. Migraciones en `backend/migration/`, sin `migrationsRun`. Transacciones con `QueryRunner` / `dataSource.transaction`. |
| Logging | Winston en `LoggerService` (`backend/src/Monitoring/monitoring-logger.service.ts`) y `Logger` de Nest en servicios. `main.ts` sigue con `console.log` en el bootstrap. |
| Errores | `HttpException` de Nest y filtro global `ExceptionFilters`. La impresión de comanda atrapa el fallo y deja el pedido guardado con aviso. |
| Validación | `class-validator` + `ValidationPipe` global en `main.ts`. |
| Auth | JWT (`JwtModule` exportado por `UserModule`, secreto `JWT_SECRET`, 120 min) y `RolesGuard` en HTTP. Este PR exige el mismo JWT en el handshake del gateway de Socket.IO. |

No hay `docs/specs/**/tasks.md`. No aplica alcance SDD.

## Problemas encontrados

### 🔴 Críticos

No se encontraron problemas críticos.

---

### 🟡 Importantes

#### La UI de stock se queda con una cantidad que no es la final
**Archivo:** `frontend/components/Hooks/useProductStore.ts` (líneas 78-81) y `frontend/app/context/ingredientsContext.tsx` (líneas 106-110)  
**Problema:** El payload puede traer el mismo stock más de una vez (promo con el mismo producto en dos slots, ingrediente y topping sobre el mismo ítem). Cada entrada tiene la cantidad **después de ese paso**, no un delta. `Array.find` se queda con la primera, que es la intermedia. La base queda bien; la tablet muestra de más hasta el próximo fetch.

Ejemplo: stock 10, dos descuentos del mismo producto → `[{ quantityInStock: 9 }, { quantityInStock: 8 }]`. La UI muestra 9.

Además la cantidad es absoluta y no trae versión. Si dos pedidos descuentan el mismo ítem y el evento viejo llega último, pisa el más nuevo.

**Código actual:**
```ts
const change = stocks.find(
  (stock) =>
    stock.productId === product.id || stock.id === product.stock?.id
);
```
**Sugerencia:** Quedarse con la última ocurrencia de cada `id` antes de aplicar. En el back, colapsar igual en los dos emisores (`StockService.emitStockEvent` y los `emit('stock.deducted' | 'stock.restored')` de `order.service.ts`), porque el servicio de órdenes emite el array crudo y no pasa por `emitStockEvent`.
```ts
const latestById = new Map(stocks.map((stock) => [stock.id, stock]));
const change = [...latestById.values()].find(
  (stock) =>
    stock.productId === product.id || stock.id === product.stock?.id
);
```
Para el cruce entre eventos, hace falta un número monótono por stock (el `counter` no sirve; un `updatedAt` o una secuencia) y ignorar un snapshot más viejo que el que ya muestra la UI.

---

#### El contador de comanda vuelve a 0 en un deploy normal
**Archivo:** `backend/src/Printer/printer.service.ts` (líneas 55-89) y `backend/migration/1782900000000-CreatePrintCounter.ts`  
**Problema:** `readLegacyCounterFile` lee `print-counter.json` desde `__dirname`. En runtime eso es `dist/.../Printer/`. Un build borra `dist/` antes de arrancar, así que el archivo casi nunca está y el `if (current === 0)` no importa nada. La migración siembra `counter = 0`. El primer día de producción después del deploy, los `COD` del ticket rearrancan en `0000` y pueden repetir códigos ya impresos ese día.

Encima `migrationsRun` está comentado en `backend/config/typeORMconfig.ts`. Si no se corre `1782900000000` a mano, `nextCommandSequence` falla, `printKitchenOrder` tira y en producción la comanda no sale (el pedido sí queda guardado, con el aviso de reimpresión).

**Código actual:**
```ts
if (current === 0) {
  const imported = this.readLegacyCounterFile();
  if (imported > 0) {
    current = imported;
  }
}
```
**Sugerencia:** Antes de borrar `dist/`, copiar el `counter` del JSON a la fila `id = 1` (o leer una ruta fuera de `dist/`, por ejemplo `process.cwd()`). Correr la migración en el deploy, antes de imprimir. Después del import, no volver a tratar `0` como “todavía no migré”: un contador legítimo en cero no debería releer el archivo en cada ticket.

---

#### El lockfile de pnpm no trae el Next que el PR declara
**Archivo:** `frontend/package.json` (línea 29) y `frontend/pnpm-lock.yaml` (línea 1371); `backend/pnpm-lock.yaml` sigue listando `escpos@3.0.0-alpha.6` (línea 1816)  
**Problema:** `frontend/package.json` fija `next` en `15.5.26` y `frontend/package-lock.json` también. `frontend/pnpm-lock.yaml` sigue en `next@15.0.3`. El README del front instala con pnpm (`pnpm dev`). Con ese lock no entra el bump de seguridad que `diagnostico.md` marca como hecho. En el back, `package.json` sacó `escpos`, `escpos-network`, `escpos-usb` y `serialport`, pero `pnpm-lock.yaml` no se actualizó en este commit: un `pnpm install --frozen-lockfile` puede fallar o reinstalar paquetes que el PR quiere fuera.

**Sugerencia:** Regenerar `frontend/pnpm-lock.yaml` y `backend/pnpm-lock.yaml` con el mismo gestor que usen en el deploy, y dejar un solo lockfile por paquete si npm y pnpm no conviven a propósito. Dependabot (`.github/dependabot.yml`) solo mira npm.

---

### 🟢 Sugerencias

#### Paths de TypeScript a paquetes que ya no están
**Archivo:** `backend/tsconfig.json` (líneas 22-23)  
**Problema:** `paths` sigue apuntando a `escpos` y `escpos-usb`, que este PR sacó de `package.json`. No hay imports en `src/`.  
**Sugerencia:** Borrar esas dos entradas para que un import futuro falle en el typecheck y no contra un paquete fantasma.

---

#### El bootstrap loguea con `console.log` teniendo el logger a mano
**Archivo:** `backend/src/main.ts` (líneas 166-173)  
**Problema:** `loggerService` ya está resuelto arriba y el listen ahora usa `PORT` / `HOST`. El mensaje de arranque y el de Swagger siguen en `console.log`; Swagger además dice siempre `localhost` aunque `HOST` sea otra interfaz.  
**Sugerencia:** Usar `LoggerService` y armar la URL de Swagger con el mismo `host` y `port`.

---

#### Dos adapters de WebSocket, gana el segundo
**Archivo:** `backend/src/main.ts` (líneas 163-164)  
**Problema:** `useWebSocketAdapter(new WsAdapter(app))` y enseguida `useWebSocketAdapter(new IoAdapter(app))`. Nest se queda con el último. La auth nueva está en el gateway de Socket.IO, así que hoy funciona, pero el `WsAdapter` no hace nada.  
**Sugerencia:** Dejar solo `IoAdapter`. Es código previo; este PR no lo introdujo, pero la auth del socket depende de que siga siendo el adapter activo.

---

#### Tests que no cubren los casos que se rompen
**Archivo:** `backend/src/Printer/printer.service.spec.ts` (líneas 61-77); no hay test de front para el patch de stock  
**Problema:** El test del contador fija el caso feliz (SELECT 4 → UPDATE 5 → devuelve 4, igual que el post-incremento viejo). No cubre archivo legado ausente, `counter === 0` ni tabla inexistente. El front no tiene test de dos cambios con el mismo `productId`.  
**Sugerencia:** Un caso con dos entradas del mismo id que espere la cantidad final, y uno de `nextCommandSequence` sin archivo legado.

---

### 📋 Preguntas / Observaciones

- Se borraron `IngredientWSListener`, `OrderDetailsWSListener`, `ToppingsGroupWSListener` y `EventsGateway`. En `development` ningún componente importaba `useIngredientStore` ni escuchaba `ingredientCreated`, `orderDetailsCreated` o `toppingsGroupCreated`. Los servicios siguen emitiendo `ingredient.*` y `toppingsGroup.*` sin nadie que los retransmita. No cambia la UI actual; si había otro cliente en la LAN escuchando esos nombres, deja de recibirlos.
- El JWT solo se valida en el handshake. `joinTable` no comprueba mesa ni rol, y `BroadcastService.broadcast` sigue yendo a todos los sockets autenticados. Encaja con el objetivo de esta fase (cerrar el socket anónimo). No es autorización por recurso.
- `webSocketService.disconnect()` en el logout vacía el mapa de listeners. Hoy no se nota porque el sign-out hace `window.location.href` y recarga el bundle. Si más adelante el logout es solo client-side, `useProductStore` no vuelve a suscribirse: `productListenersBound` queda en `true`.
- `tsconfig` del back y el filtro global de excepciones no cambiaron de patrón. El `DataSource` inyectado en `PrinterService` es coherente con TypeORM ya cargado en `AppModule`.

## Veredicto

| | |
|-|-|
| **Estado** | ⚠️ Aprobado con cambios |
| **Críticos** | 0 |
| **Importantes** | 3 |
| **Sugerencias** | 4 |

Antes de mergear: aplicar la última cantidad por stock (no la primera), no depender de `print-counter.json` dentro de `dist/` y alinear el lockfile de pnpm con Next 15.5.26. Correr la migración `1782900000000` en el deploy.
