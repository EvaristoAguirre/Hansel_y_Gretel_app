# PR Review: feat-implementacion-arca

**Fecha:** 2026-11-03  
**Rama base:** development (`origin/development`)  
**Merge-base:** `4a5ac96`  
**Commits incluidos:** 23  
**Archivos modificados (reales, vía merge-base):** 94

La detección mecánica de la skill toma la primera rama que existe, y `origin/main` existe. Esta rama está mergeada con `development`, va 0 commits atrás de `origin/development` y el diff contra `main` mete otros ~130 archivos que ya están en `development` (archivado, pnpm, guards, WebSocket). El review usa `origin/development...HEAD`.

## Resumen ejecutivo

El PR agrega Factura B (ARCA / WSFEv1): configuración con simulación por defecto, tablas, cálculo de IVA, emisión al cobrar, ticket, PDF, mail, listado con reintento y factura manual. El cobro se commitea antes de pedir el CAE, y un fallo de ARCA no deshace la venta. Esa decisión es la correcta para el salón.

No está en condiciones de mergear. Hay tres defectos que producen un comprobante inválido o una orden cobrada sin factura recuperable: la fecha que Postgres devuelve se manda mal al QR y al reintento, el simulador olvida la numeración al reiniciar el proceso, y una respuesta SOAP que no es un rechazo de negocio se guarda como `rejected` y la emisión siguiente suelta ese número.

## Patrones del proyecto detectados

| Aspecto | Patrón detectado |
|---------|-----------------|
| ORM/DB | TypeORM con PostgreSQL. `synchronize: false`. Transacciones con `QueryRunner` en órdenes y caja. El módulo de facturas usa `Repository` directo, sin un repositorio propio. |
| Logging | `Logger` de Nest y `LoggerService` (winston) en `src/Monitoring/`. El servicio de facturas no loguea. |
| Errores | Excepciones HTTP de Nest (`BadRequestException`, `ConflictException`, `NotFoundException`) y `ExceptionFilters` global. `AfipConfigError` corta el arranque. |
| Validación | `class-validator` + `ValidationPipe` global (`whitelist`, `transform: true`). |
| Auth | `RolesGuard` verifica el JWT y el rol. Facturas: `ADMIN` y `ENCARGADO`. `GET /invoices/arca/parametros` solo `ADMIN`. |

No hay `docs/specs/**/tasks.md`. El alcance está en `docs/plan-implementacion.md`: pasos 1 a 13 escritos en código; el paso 8 no se probó contra homologación; el paso 14 (producción) no está hecho. Nota de crédito, DNI/CUIT del receptor y factura A quedan fuera del plan.

## Problemas encontrados

### 🔴 Críticos

#### La fecha leída de Postgres no es `AAAA-MM-DD`

**Archivo:** `backend/src/Invoice/fiscal-ticket.ts` (líneas 52 y 64), `backend/src/Invoice/invoice.service.ts` (línea 690), `backend/src/Invoice/invoice-format.ts` (líneas 1-6)

**Problema:** `cbteFch` y `caeFchVto` son columnas `date`. `pg-types` parsea el OID 1082 con `postgres-date`, que arma un `Date` a medianoche local. El ticket, el PDF, el QR y el reintento hacen `String(fecha).slice(0, 10)`. En este entorno eso es `Tue Nov 03`, no `2026-11-03`.

La primera solicitud a ARCA usa el string de `argentinaIsoDate()` y sale bien. El ticket del cobro no: `fiscalTicket()` vuelve a leer la fila. El QR de la RG 4892 queda con `fecha` inválida, el papel imprime el `Date` de JavaScript, y un reintento manda ese texto como `CbteFch`.

**Código actual:**

```ts
cbteFch: String(invoice.cbteFch).slice(0, 10).replace(/-/g, ''),
// fiscal-ticket.ts
fecha: String(invoice.cbteFch).slice(0, 10),
```

**Sugerencia:**

```ts
export function civilDate(value: string | Date | null | undefined): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const text = String(value ?? '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}
```

Usar `civilDate` en `formatFiscalDate`, `fiscalTicketFromInvoice`, `solicitudFromInvoice` y `comprobanteMatchesInvoice`. Los getters locales coinciden con el parseo de `postgres-date`. Un test tiene que hidratar la fila como `Date`, no como string.

**Resolución (2026-11-03):** `civilDate` quedó en `invoice-format.ts`. La usan el formato fiscal, el ticket (papel, PDF y QR), `solicitudFromInvoice`, `comprobanteMatchesInvoice` y las fechas que salen en el listado y el detalle. El test de formato arma `new Date(2026, 10, 3)` y espera `2026-11-03`. El de servicio hidrata la fila autorizada como `Date` y revisa el ticket y el `fecha` del QR.

---

#### Al reiniciar, el simulador vuelve a pedir el número 1 y la orden queda sin factura

**Archivo:** `backend/src/Invoice/arca-simulator.ts` (líneas 20-27), `backend/src/Invoice/invoice.service.ts` (líneas 604-652), `backend/src/Order/services/order.service.ts` (líneas 875-887)

**Problema:** `ArcaSimulator.ultimoAutorizado` solo mira un `Map` en memoria. `allocateNumber` hace `ultimo + 1` y después busca pendientes o rechazadas de ese candidato. No mira el máximo `cbteNro` ya `authorized` en `invoices`.

`AFIP_SIMULATE` por defecto es `true`. Después de reiniciar el backend el simulador responde 0, el candidato es 1 y el `INSERT` choca con `UQ_invoices_number`. Esa excepción no entra en `persistFailedAttempt`. `closeOrder` la convierte en una factura ficticia (`id: ''`, sin fila). La orden ya está cobrada y el listado no tiene reintento. El plan deja fuera facturar después una orden cobrada sin factura.

En homologación el último número sale de ARCA y este caso no se da. El modo en el que se va a usar el módulo hasta tener certificado, sí.

**Código actual:**

```ts
let max = 0;
for (const comprobante of this.authorized.values()) {
  if (comprobante.ptoVta === ptoVta && comprobante.cbteTipo === cbteTipo) {
    max = Math.max(max, comprobante.cbteNro);
  }
}
return max;
```

**Sugerencia:** en `allocateNumber`, el candidato tiene que ser `max(último de ARCA, máximo local authorized) + 1`, filtrando por `afipEnv`, `ptoVta` y `cbteTipo`. El índice único sigue siendo la red de seguridad, no la numeración. Si el `save` igual choca, hay que dejar la fila `pending` con `cbteNro` null y el error de base, no un `id` vacío.

**Resolución (2026-11-03):** `allocateNumber` usa ese máximo. Un `23505` de `UQ_invoices_number` persiste la fila `pending` con `cbteNro` null y el mensaje de la base. El `id` vacío de `closeOrder` queda para un fallo que no es ese choque.

---

#### Una respuesta que no es un rechazo de ARCA se guarda como `rejected` y se libera el número

**Archivo:** `backend/src/Invoice/arca-wsfe-client.ts` (líneas 148-172), `backend/src/Invoice/arca-soap.ts` (líneas 148-151), `backend/src/Invoice/invoice.service.ts` (líneas 640-649 y 719-723)

**Problema:** `httpsSoapPost` resuelve con cualquier status HTTP. `solicitar` autoriza solo si hay `Resultado = A` y CAE. Todo lo demás — fault SOAP, HTML de un 500, cuerpo vacío — vuelve como `rejected`. El servicio persiste `status: 'rejected'`. La factura siguiente, en `allocateNumber`, ve esa fila, pone `cbteNro` en null y reutiliza el número.

Eso es correcto cuando ARCA respondió `Resultado = R` y no consumió el número. No lo es si el comprobante se autorizó y la respuesta se perdió, o si el body es un fault. El reintento de la fila original ya no puede consultar: el número quedó en `releasedCbteNro` y `retryLocked` no lo usa. El CAE queda desvinculado.

El `catch` de `persistAndRequest` que convierte un throw en `timeout` no cubre este camino, porque el cliente no lanza: devuelve `rejected`.

**Código actual:**

```ts
if (resultado === 'A' && cae) {
  return { outcome: 'authorized', cae, caeFchVto: tag(xml, 'CAEFchVto') ?? '', reproceso: false };
}
return {
  outcome: 'rejected',
  errors: errors.length ? errors : [{ code: 'R', msg: 'ARCA rechazó el comprobante sin detalle.' }],
};
```

**Sugerencia:** tratar como rechazo solo `Resultado = R`. Status distinto de 2xx, `faultstring`, o ausencia de `Resultado` tienen que ser `timeout` (consultar, y si no hay comprobante dejar `pending` con el número). `releaseNumber` solo cuando el resultado guardado es un `R` explícito. Revisar `res.statusCode` en `httpsSoapPost` y fallar si no es 2xx.

**Resolución (2026-11-03):** `httpsSoapPost` rechaza un status fuera de 2xx. `solicitar` devuelve `rejected` solo con `Resultado = R`. Fault, HTTP no exitoso, corte de red o cuerpo sin `Resultado` quedan en `timeout`, así el número sigue en la fila y el reintento puede consultar. `releaseNumber` corre únicamente si `resultado === 'R'`.

---

### 🟡 Importantes

#### El servicio de facturas no deja rastro cuando ARCA o la base fallan

**Archivo:** `backend/src/Invoice/invoice.service.ts` (líneas 328-337, 456-470 y 534-548)

**Problema:** El resto del backend loguea con `Logger` de Nest y, en caja e impresora, también con `LoggerService`. `InvoiceService` traga el error de `solicitar`, de la consulta y del reintento y solo lo guarda en `arcaErrors` si llega a persistir. Un choque de numeración o un token caído se ven, como mucho, en el log de `closeOrder` (`emitForOrder`). No queda el número, el código de ARCA ni el modo.

**Sugerencia:** un `Logger` en el servicio, en rechazo, timeout, `CONSULTA`, `MISMATCH` y en el `catch` de `closeOrder`, con `afipEnv`, `ptoVta`, `cbteNro` e id de factura. Sin token, sin sign y sin la clave.

**Resolución (2026-11-03):** `InvoiceService` loguea esos casos, y también el choque de numeración, con ambiente, punto de venta, número e id. El `catch` de `closeOrder` registra ambiente, punto de venta y el mensaje. No se escribe el token, el sign ni la clave.

---

#### La pantalla de ventas deja de mostrar el error

**Archivo:** `frontend/components/DailyCash/TabSales/DailySalesView.tsx` (el `catch` de la carga y el bloque que se eliminó junto al título)

**Problema:** El cambio para un día sin caja está bien: grilla vacía en vez de un 404. En el mismo diff se borró el `Typography` que renderizaba `error`. Un fallo de red o de permiso sigue haciendo `setError`, pero la pantalla queda en blanco, igual que un día sin movimientos.

**Sugerencia:** mantener el vacío cuando no hay caja y volver a mostrar `error` para el resto de fallos.

**Resolución (2026-11-03):** El `Typography` de error que está antes de «Ventas por Día» sigue. El que salió en el diff era el duplicado de movimientos. Un día sin caja deja las grillas vacías y no setea `error`. Cualquier otro fallo muestra ese texto y también vacía las grillas, para no dejarlas en `null`.

---

#### Dos migraciones comparten el timestamp `1783400000000`

**Archivo:** `backend/migration/1783400000000-CreateInvoicesAndProductAlicuota.ts` y `backend/migration/1783400000000-AddArchiveSnapshotAndRunTables.ts` (esta última ya está en `development`)

**Problema:** TypeORM ordena por timestamp. El revert y el orden entre estas dos quedan atados al nombre del archivo. Además, el `CREATE TABLE` usa `uuid_generate_v4()` y `CREATE EXTENSION "uuid-ossp"` está en la migración siguiente (`1783500000000`). En una base que todavía no tiene la extensión, la primera migración falla antes de llegar a la que la crea.

**Sugerencia:** renumerar la de facturas a un timestamp posterior al de archivado, y crear la extensión al inicio de esa migración, antes del `CREATE TABLE`.

**Resolución (2026-11-03):** El archivo pasó a `1783410000000-CreateInvoicesAndProductAlicuota.ts` y crea `uuid-ossp` antes del `CREATE TABLE`. En esta base la fila de `migrations` ya tenía el nombre `1783400000000`; se actualizó a `CreateInvoicesAndProductAlicuota1783410000000` para que no se vuelva a correr. Otra base que haya aplicado el nombre viejo necesita el mismo `UPDATE` de `timestamp` y `name`.

---

### 🟢 Sugerencias

#### El generador manual puede emitir dos veces y parsea el precio a mano

**Archivo:** `frontend/components/DailyCash/TabInvoices/ManualInvoiceDialog.tsx` (líneas 62 y 74-94)

**Problema:** `submit` no deshabilita el botón. Dos clics son dos Facturas B. El precio del catálogo hace `replace` de todos los puntos. Hoy el alta formatea con `es-AR` y 0 decimales (`1.500` → `1500`) y cierra bien. Si el valor llega como `1500.50`, el mismo replace lo convierte en `150050`. En el front ya está `parseEsARNumber`.

**Sugerencia:** un flag `submitting` alrededor del `POST`, y parsear el precio con `parseEsARNumber`.

**Resolución (2026-11-03):** Emitir y Cancelar quedan deshabilitados mientras dura el POST, y un ref descarta el segundo clic antes del render. El precio del catálogo se lee con `parseEsARNumber`.

---

#### El reintento no mueve la fecha del comprobante

**Archivo:** `backend/src/Invoice/invoice.service.ts` (líneas 450-452 y 690)

**Problema:** Un `pending` de un día anterior se reenvía con la `cbteFch` original. ARCA suele rechazar una fecha fuera de la ventana (pocos días hacia atrás). El mensaje le queda al operador como un rechazo de datos.

**Sugerencia:** si la fecha guardada está fuera de la ventana de productos, actualizar `cbteFch` a `argentinaIsoDate()` antes de `solicitar`, y dejar la fecha vieja en `arcaErrors` por si hay que auditarla.

**Resolución (2026-11-03):** En el reintento, después de consultar y antes de `solicitar`, una `cbteFch` fuera de ±5 días (ventana de productos) pasa a la fecha civil de hoy. La anterior queda en `arcaErrors.previousCbteFch`. Una fecha de ayer no se mueve. Si la consulta encuentra el CAE con la fecha original, se autoriza esa y no se reescribe.

---

#### `backend/.gitignore` ignora `docs/*`

**Archivo:** `backend/.gitignore` (línea 66)

**Problema:** El PR mueve la documentación a `docs/` y al mismo tiempo ignora todo lo que haya ahí sin trackear. Los archivos ya commiteados siguen versionados. Un documento nuevo en `docs/` no entra en `git add` salvo que se fuerce.

**Sugerencia:** sacar `docs/*` de ese ignore. El `.env` y los certificados ya están cubiertos más arriba.

**Resolución (2026-11-03):** No se cambia. `docs/*` sigue ignorado.

---

### 📋 Preguntas / Observaciones

- El candado de numeración es un `Map` en el proceso (`withLock`). Con una sola instancia alcanza, y el test de concurrencia cubre ese caso. Dos procesos pueden pedir el mismo número; el índice único frena el duplicado y la orden perdedora cae en el mismo hueco del hallazgo del simulador (cobrada, sin fila).
- `AFIP_CONCEPTO` acepta 2 y 3, pero el XML no manda `FchServDesde`, `FchServHasta` ni `FchVtoPago`. El default es 1 (productos) y con eso el comprobante cierra. Con 2 o 3, ARCA rechaza todas las emisiones.
- La factura manual no escribe en la caja. Está así en el paso 13 del plan.
- Nota de crédito, DNI/CUIT del receptor y el tope de consumidor final no están. El plan y la auditoría los dejan fuera. No es un defecto de este slice. Conviene no salir a producción (paso 14) con mesas de importe alto hasta definir el documento del receptor.
- El paso 8 está cubierto con SOAP falso. No hay una llamada real a `wsaahomo`. El merge a `development` puede hacerse en simulación; homologación sigue siendo una prueba pendiente, no un bug de este diff.
- El nombre del PDF descargado es siempre `factura-b.pdf`. El mail sí arma `factura-b-{punto}-{número}.pdf`.

## Veredicto

| | |
|-|-|
| **Estado** | Cambios aplicados el 2026-11-03. Pendiente de re-revisión. |
| **Críticos** | 3 resueltos |
| **Importantes** | 3 resueltos |
| **Sugerencias** | 2 aplicadas. `docs/*` sigue ignorado a pedido. |

Quedaron resueltos la fecha civil al leer columnas `date`, la numeración con el máximo local autorizado y el rechazo solo cuando ARCA devuelve `Resultado = R`.
