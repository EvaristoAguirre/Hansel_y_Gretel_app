# Propuesta técnica — Facturación electrónica (Factura B)

Plan de implementación para el gestor de restaurante (NestJS + TypeORM + PostgreSQL en la notebook, Next.js en la LAN). La descripción funcional está en `propuesta-cliente.md`. El marco de ARCA está en `api-arca-requerimientos.md`.

Las suposiciones de este documento valen hasta cerrar las dudas de la sección 8. No empezar la Fase 2 sin la duda 1 (Responsable Inscripto) y la duda 3 (alícuota única).

---

## 1. Decisiones de diseño

1. **El backend de la notebook es el único cliente de ARCA.** SOAP sobre HTTPS saliente (puerto 443). La LAN tablet ↔ notebook sigue en HTTP. La tablet nunca ve el certificado ni la clave privada.
2. **Una orden cerrada produce como máximo una factura.** El pago parcial por productos y el pago con varios medios siguen siendo un solo `closeOrder`. El switch no parte el comprobante.
3. **El cobro no espera a ARCA para liberar la mesa.** Misma idea que la impresora: la transacción de caja commitea primero; la autorización corre después, con timeout. Un fallo de red no revierte el cobro.
4. **La factura no depende de la fila de `orders`.** El archivado semanal copia la orden a `archived_orders` (mismo UUID) y borra la original. La factura guarda `orderId` como UUID sin FK con borrado en cascada, más una foto de los importes e ítems en el momento del cobro.
5. **Importe fiscal = consumo redondeado − descuento. La propina no entra.** Sale de `orders.total`, `discountAmount` y `tip`, que `closeOrder` ya separa. No reutilizar el cálculo del ticket térmico: `printTicketOrder` hoy estima una propina del 10 % para imprimir y no es la base fiscal.
6. **Precios con IVA incluido y una sola alícuota** (a confirmar, propuesta 21 %). El sistema desglosa neto e IVA para WSFEv1; el ticket al cliente muestra el total con IVA incluido y la leyenda de IVA contenido.
7. **Receptor fijo en v1:** consumidor final. `DocTipo` 99, `DocNro` 0, `CbteTipo` 6 (Factura B). El id de `CondicionIVAReceptorId` se toma de `FEParamGetCondicionIvaReceptor` en homologación y se deja en configuración. No hardcodear un id de memoria.
8. **Reimprimir y el PDF no llaman a ARCA.** Usan la foto local. Solo una factura autorizada se imprime o se descarga como comprobante. Reintentar sí llama a ARCA, y antes pasa por `FECompConsultar` para no duplicar.
9. **Homologación y producción se cambian por entorno** (URLs, certificado, clave, CUIT, punto de venta). El código de negocio es el mismo.

## 2. Arquitectura

```
Encargada (Pay.tsx)                Pestaña Facturas
        |                                  |
        | POST /order/:id/close            | GET/POST /invoices...
        v                                  v
   OrderService.closeOrder          InvoiceController
        |                                  |
        | commit cobro                     |
        v                                  v
   InvoiceService.solicitar() -------> ArcaClient
        |                               WSAA (TA 12 h)
        |                               WSFEv1
        v                                  |
   tabla invoices  <---- CAE / error ------+
        |
        +---- PrinterService.ticket fiscal (solo si autorizado)
        +---- PDF on demand (pdfkit + QR)
        +---- mail con PDF adjunto
```

Módulo nuevo `backend/src/Invoice/`:

| Pieza | Responsabilidad |
|---|---|
| `ArcaClient` | TRA, firma CMS, `loginCms`, caché del TA, métodos WSFEv1 usados. Sin reglas de restaurante |
| `InvoiceService` | Armar el comprobante desde la orden, numeración, estados, reintento seguro, foto de ítems |
| `InvoicePdfService` | PDF con los datos obligatorios y el QR |
| `InvoiceMailService` | Envío del PDF. No reutilizar `NotificationService`: hoy tiene Gmail y una contraseña de aplicación hardcodeados como placeholder |
| `InvoiceController` | Listado, detalle, reintento, PDF, email, reimpresión. Roles Admin y Encargado |

Librería SOAP: en la Fase 1 se prueba una que **firme en la notebook** con la clave local (candidato a evaluar: `afip.ts` u otra equivalente mantenida). No usar un SaaS que se quede con la clave privada. Si ninguna librería cubre el flujo con calidad suficiente, el cliente SOAP queda detrás de `ArcaClient` igual y el resto del módulo no cambia.

## 3. Base de datos

Migración TypeORM nueva. Importes en `numeric`, nunca `float`.

### 3.1. `invoices`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `orderId` | uuid, unique, sin FK | Mismo id en `orders` o, después del archivado, en `archived_orders` |
| `status` | enum | `pending`, `authorized`, `rejected` |
| `ptoVta` | int | Copiado de la config al emitir |
| `cbteTipo` | int | 6 |
| `cbteNro` | int, nullable | Se asigna al armar el request, después de `FECompUltimoAutorizado` |
| `cbteFch` | date | Día del cobro (fecha de proceso local). Es la que se manda a ARCA |
| `concepto` | int | Default a confirmar (ver duda 9). Propuesta: 1 Productos |
| `docTipo` / `docNro` | int | 99 / 0 |
| `condicionIvaReceptorId` | int | |
| `impTotal` / `impNeto` / `impIva` / `impTotConc` / `impOpEx` / `impTrib` | numeric(14,2) | |
| `alicuotaId` | int | Id WSFEv1 de la alícuota (21 % suele ser 5; verificar con `FEParamGetTiposIva`) |
| `alicQuota` | numeric(5,2) | Porcentaje, para el PDF y el ticket |
| `discountAmount` | numeric(12,2) | Informativo |
| `tipExcluded` | numeric(12,2) | Informativo, no va a ARCA |
| `cae` | varchar, nullable | |
| `caeFchVto` | date, nullable | |
| `resultado` | char, nullable | `A` o `R` del último intento |
| `arcaErrors` | jsonb, nullable | `Errors` y `Observaciones` del último intento |
| `customerEmail` | varchar, nullable | |
| `emailSentAt` | timestamptz, nullable | |
| `snapshot` | jsonb | Ítems, mesa, razón social usada. Ver 3.3 |
| `attemptCount` | int | |
| `lastAttemptAt` | timestamptz, nullable | |
| `authorizedAt` | timestamptz, nullable | |
| `createdAt` / `updatedAt` | timestamptz | |

Unique parcial: `(ptoVta, cbteTipo, cbteNro)` donde `cbteNro` no es nulo.

Índice para el listado: `(cbteFch)` y, si hace falta, `(status, cbteFch)`.

### 3.2. `afip_tokens`

Una fila por servicio (`wsfe`): `token`, `sign`, `expirationTime`. Se reutiliza hasta el vencimiento (12 h). Pedir otro TA vigente hace fallar WSAA. Sobrevive a un reinicio del proceso.

### 3.3. Foto (`snapshot`)

Se escribe al crear la factura, antes de llamar a ARCA, para que el PDF y la reimpresión no dependan de productos renombrados ni del archivado.

```json
{
  "tableName": "5",
  "lines": [
    { "name": "Café con leche", "quantity": 2, "unitaryPrice": 2500, "subtotal": 5000 }
  ],
  "consumption": 10000,
  "discountAmount": 1000,
  "tipExcluded": 900,
  "emitter": {
    "cuit": "...",
    "razonSocial": "...",
    "domicilio": "...",
    "condicionIva": "Responsable Inscripto",
    "iibb": "...",
    "inicioActividades": "YYYY-MM-DD"
  }
}
```

Las líneas salen del mismo criterio que el ticket actual (`buildProductLines`): unidades activas, toppings con cargo visibles, subtotal alineado con `orders.total`.

### 3.4. Configuración

Variables de entorno, no tabla editable desde la UI en v1. Documentarlas en `backend/.env.example` sin secretos.

| Variable | Uso |
|---|---|
| `AFIP_ENV` | `homologacion` o `produccion` |
| `AFIP_CUIT` | CUIT del emisor, sin guiones |
| `AFIP_PTO_VTA` | Punto de venta electrónico |
| `AFIP_CERT_PATH` / `AFIP_KEY_PATH` | Archivos fuera del repo. Permisos de lectura solo para el usuario que corre el backend |
| `AFIP_WSAA_URL` / `AFIP_WSFE_URL` | Por ambiente |
| `AFIP_ALICUOTA_ID` / `AFIP_ALICUOTA_PCT` | Una sola alícuota |
| `AFIP_CONDICION_IVA_RECEPTOR_ID` | Consumidor final, id verificado en homo |
| `AFIP_CONCEPTO` | 1, 2 o 3 |
| `AFIP_RAZON_SOCIAL`, `AFIP_DOMICILIO`, `AFIP_IIBB`, `AFIP_INICIO_ACTIVIDADES` | Pie de ticket y PDF |
| `AFIP_TIMEOUT_MS` | Timeout de cada llamada. Propuesta: 8000. Un intento. El reintento es manual desde el listado |
| `SMTP_*` | Recién en la Fase 5. Host, puerto, usuario, clave de aplicación, remitente |

El certificado de homologación (WSASS) y el de producción no se mezclan. Cambiar `AFIP_ENV` sin cambiar el par cert/clave tiene que fallar al arrancar con un mensaje claro, no en la primera venta.

## 4. Cálculo del comprobante

Partir de la orden ya cerrada (después del commit):

```
consumoRedondeado = round(suma de subtotales activos)   // igual que grossRounded en closeOrder
netoConIva        = consumoRedondeado - discountAmount  // propina fuera
impTotal          = netoConIva                           // pesos enteros en la práctica
impNeto           = round(impTotal / (1 + alicuota/100), 2)
impIva            = round(impTotal - impNeto, 2)
```

Ajustar el último centavo para que `impNeto + impIva = impTotal`. `ImpTotConc`, `ImpOpEx` e `ImpTrib` en 0. Moneda `PES`, cotización 1. Array `Iva` con un solo ítem (`Id` = `AFIP_ALICUOTA_ID`, `BaseImp` = `impNeto`, `Importe` = `impIva`).

Si `netoConIva <= 0` (descuento del 100 %), no se crea factura y el cobro responde un error de validación antes de cerrar, o se ignora el switch. Propuesta: rechazar el request con mensaje “No se puede facturar un importe cero”.

`CbteDesde` = `CbteHasta` = último autorizado + 1.

## 5. Máquina de estados y reintento

```
crear fila pending + cbteNro
        |
        v
   FECAESolicitar
     |         |
     A         R
     |         |
authorized   rejected  (se guardan Observaciones)
     |
timeout o sin respuesta
     |
FECompConsultar(ptoVta, cbteTipo, cbteNro)
     |                    |
  existe con CAE      no existe
     |                    |
authorized            sigue pending
                      (el botón Reintentar vuelve a FECAESolicitar
                       con el mismo número)
```

Reglas:

- Lock en proceso (mutex por `ptoVta` + `cbteTipo`) para que dos cobros simultáneos no lean el mismo último número. Con un solo backend alcanza un lock en memoria; el unique de `(ptoVta, cbteTipo, cbteNro)` es la red de seguridad.
- Nunca un segundo `FECAESolicitar` si `FECompConsultar` devolvió CAE.
- `Reproceso = S` en la respuesta se trata como autorización ya hecha: persistir ese CAE.
- `FEDummy` no bloquea el cobro. Si se quiere un aviso previo, puede llamarse al abrir la pantalla de pago, con el resultado cacheado un par de minutos. Si falla, el switch sigue disponible y la factura nacerá `pending`.

## 6. API

Todas con `RolesGuard`, roles `Admin` y `Encargado`. Respuestas de error en español, igual que el resto de la API.

### Cobro (cambio de contrato)

`POST /order/:id/close` suma un campo opcional:

```json
{ "invoice": true }
```

Default `false` si no viene, para no facturar clientes viejos del front.

Orden interna de `closeOrder`:

1. Transacción actual de cobro (sin cambios de caja).
2. Commit.
3. Si `invoice` es true: crear `invoices` en `pending` y disparar la autorización **sin** devolver 500 si ARCA falla.
4. La respuesta del cobro agrega un bloque opcional:

```json
{
  "invoice": {
    "id": "...",
    "status": "authorized | pending | rejected",
    "cbteNro": 123,
    "cae": "...",
    "message": "texto para el Swal"
  }
}
```

5. Impresión, después del resultado:
   - `authorized`: ticket fiscal (no el ticket de cuenta).
   - `pending` o `rejected`: ticket de cuenta actual, más `printerWarning` si la térmica falla.
   - `invoice` false: ticket de cuenta actual, como hoy.

El fallo de impresión no cambia el estado de la factura. Ya queda autorizada; se reimprime desde el listado.

### Facturas

| Método | Uso |
|---|---|
| `GET /invoices?month=&year=` | Listado del mes. Ordenado por fecha descendente |
| `GET /invoices/:id` | Detalle, incluida la foto y `arcaErrors` |
| `POST /invoices/:id/retry` | Solo `pending` o `rejected`. Aplica la sección 5 |
| `POST /invoices/:id/print` | Solo `authorized`. Llama a un método nuevo del `PrinterService` |
| `GET /invoices/:id/pdf` | Solo `authorized`. `Content-Disposition: attachment` |
| `PATCH /invoices/:id/email` | Body `{ "email": "..." }`. Valida formato. No envía |
| `POST /invoices/:id/send-email` | Solo `authorized` y con email. Adjunta el PDF. Si falla, 502 con mensaje y no borra el email. Si sale, setea `emailSentAt` |

No hay `DELETE`. Un CAE no se anula por API (ver duda 6, nota de crédito).

## 7. Frontend

### 7.1. Cobro — `frontend/components/Order/Pay.tsx`

- Switch “Emitir Factura B”, default apagado, visible en modo total y en modo parcial, al lado del botón que dispara `handlePayOrder`.
- Texto secundario con el importe a facturar (consumo − descuento, sin propina). En modo parcial el descuento hoy no se envía; el importe es el consumo.
- Se manda `invoice: true` dentro de `orderToClosed` (`frontend/api/order.ts`).
- El `Swal` de éxito distingue los tres estados. En `pending` y `rejected` el título deja claro que **la orden sí se cobró**.
- El switch no se ofrece si la orden no está en `pending_payment` (igual que el cobro).

### 7.2. Pestaña Facturas — `PanelDailyCash.tsx`

Cuarta tab, “Facturas”, solo en la ruta ya protegida (`Admin`, `Encargado`).

- Filtros mes y año con MUI, default mes actual. Misma línea visual que `DailySalesView` (DataGrid).
- Columnas: fecha, comprobante (`punto de venta` con 4 dígitos + número con 8), importe, estado, email.
- Acciones por fila según estado (la matriz está en `propuesta-cliente.md`). Botones deshabilitados con tooltip que explica por qué, en vez de ocultarlos todos: así se entiende que reimprimir exige CAE.
- Modal de detalle: datos del snapshot, CAE, vencimiento, QR en pantalla si está autorizada (el mismo payload del PDF), observaciones de ARCA si las hay.
- Reintentar pide confirmación. Al volver, refresca la fila.
- Descargar PDF: `window.open` o blob sobre el GET autenticado (el token va en header, no en la URL).
- Guardar email: diálogo con un campo. Enviar: confirmación y aviso de éxito o de fallo de correo.

Estados vacíos: “No hay facturas en ese mes”.

### 7.3. Ticket fiscal

Método nuevo, no un `if` gigante dentro de `printTicketOrder`. Papel 80 mm, ESC/POS, misma impresora (`PRINTER_HOST` / `PRINTER_PORT`).

Contenido mínimo:

- Razón social, domicilio, CUIT, condición IVA, IIBB, inicio de actividades
- “FACTURA B”, punto de venta y número
- Fecha
- Ítems y descuento (de la foto)
- Total
- “Consumidor final”
- IVA contenido (el `impIva` calculado)
- CAE y vencimiento del CAE
- QR según el esquema de la RG 4892: JSON en base64 con `ver`, `fecha`, `cuit`, `ptoVta`, `tipoCmp`, `nroCmp`, `importe`, `moneda`, `ctz`, `tipoDocRec`, `nroDocRec`, `tipoCodAut` = `E`, `codAut` = CAE. URL `https://www.afip.gob.ar/fe/qr/?p=<base64>`

El QR en térmica depende de que la impresora acepte el comando de imagen o QR nativo. En la Fase 4 se prueba con la impresora real del local. Si el comando QR no es fiable, se imprime la imagen raster del QR. El PDF no tiene ese problema.

En `NODE_ENV !== production` no se manda nada a la térmica, igual que el ticket actual; se loguea el contenido.

## 8. Dudas abiertas

Funcionales (también están en `propuesta-cliente.md`, para contestar con el local). Técnicas, para cerrarlas en el diseño.

| # | Duda | Si no se contesta, se asume | Impacto si la respuesta es otra |
|---|---|---|---|
| 1 | ¿El emisor es Responsable Inscripto? | Sí, porque se pidió Factura B (`CbteTipo` 6) | Monotributo → Factura C (`CbteTipo` 11), otros importes (sin discriminar IVA igual, pero el tipo cambia) y hay que rehacer ticket, PDF y config |
| 2 | ¿La propina queda fuera? | Sí | Incluirla obliga a definir si es gravada y cambia el total que ve ARCA respecto de la caja |
| 3 | ¿Una sola alícuota para toda la carta? | Sí, 21 %, precios con IVA incluido | Hay que agregar alícuota al producto y armar varios ítems en el array `Iva`. No entra en estas fases |
| 4 | ¿Siempre consumidor final, o DNI desde cierto monto? | Siempre 99/0 | El cobro pide tipo y número de documento cuando el importe supera el tope que indique el contador. El tope no se inventa en código |
| 5 | ¿Facturar después una orden cobrada sin switch? | No en v1 | Endpoint extra que crea la factura sobre una orden cerrada o archivada, con `cbteFch` dentro de la ventana. La pestaña Ventas sería el lugar |
| 6 | ¿Nota de crédito en esta versión? | No | Tabla o tipo de comprobante nuevo (`CbteTipo` 8, Nota de Crédito B), asociación al comprobante original, acción “Anular” en el listado. Sin esto no hay corrección fiscal |
| 7 | ¿Email en el listado o también en el cobro? | Solo en el listado | Un campo más en `Pay.tsx`, guardado en la fila al crearla |
| 8 | ¿Ticket fiscal reemplaza al de cuenta? | Sí, cuando hay CAE | Si quieren los dos, se encadenan las dos impresiones |
| 9 | ¿Concepto 1 Productos, 2 Servicios o 3? | 1 Productos | Cambia la ventana de fechas (±5 vs ±10) y los campos de período de servicio. Confirmar con el contador |
| 10 | Id de condición IVA receptor y de alícuota | Se leen en homologación en la Fase 1 y se fijan en env | No bloquear el diseño de tablas |
| 11 | ¿El QR de la térmica sale nativo o como imagen? | Se decide en la Fase 4 con la impresora del local | No cambia el modelo de datos |
| 12 | SMTP real | Fase 5, variables nuevas. El `NotificationService` actual no sirve para esto | Sin casilla configurada, la Fase 5 no se puede cerrar. Guardar email y bajar PDF no dependen del SMTP |

## 9. Fases

Cada fase se puede probar sin la siguiente. No mezclar el certificado de producción en las fases 1 a 5.

### Fase 0 — Alta fiscal y respuestas (sin código de producto)

**Salida:** dudas 1, 2, 3 y 9 contestadas; certificado de homologación generado; punto de venta de homo habilitado; servicio `wsfe` asociado al certificado; archivos de cert y clave en la máquina de desarrollo, fuera del repo.

Sin esto la Fase 1 no tiene contra qué hablar.

### Fase 1 — Cliente ARCA en homologación

**Objetivo:** la notebook obtiene un TA y lee parámetros. Todavía no se factura una orden.

- Módulo `ArcaClient` + caché de TA en `afip_tokens`.
- Variables de entorno y fail-fast si falta cert, clave o CUIT.
- Script o endpoint de admin (solo Admin) que ejecute `FEDummy`, `FEParamGetPtosVenta`, `FEParamGetTiposIva`, `FEParamGetCondicionIvaReceptor` y muestre el resultado.
- Anotar en `.env` los ids reales de alícuota y de condición IVA receptor.
- Reloj: documentar en el checklist de despliegue que la notebook sincroniza NTP. Un TRA rechazado por hora desfasada se loguea con ese motivo.

**Listo cuando:** en homologación, dos arranques seguidos reutilizan el mismo TA y `FEDummy` responde OK.

### Fase 2 — Emisión al cobrar

**Objetivo:** el switch crea la factura y pide el CAE, sin romper el cobro si ARCA no está.

- Migración `invoices`.
- `invoice` en `CloseOrderDto`.
- Cálculo de importes y foto de ítems.
- Flujo de la sección 5, con tests del servicio mockeando `ArcaClient`: autorizado, rechazado (observación), timeout + consulta que encuentra CAE, timeout + consulta que no encuentra (queda pending), segundo cobro concurrente no repite número.
- Respuesta del cobro con el bloque `invoice`.
- Front: switch, importe, mensajes. Ticket fiscal solo en el camino `authorized` (puede ser una versión mínima; el QR prolijo se cierra en la Fase 4).
- No facturar importe ≤ 0.

**Listo cuando:** en homologación, una orden de prueba con el switch encendido queda `authorized` con CAE en la base, la mesa se liberó, y con la red cortada la misma orden queda cobrada y la factura `pending` sin duplicar al reintentar la llamada a mano (aunque el botón de la UI llegue en la Fase 3, el servicio de reintento ya tiene que existir y estar testeado).

### Fase 3 — Listado y reintento

**Objetivo:** operar las pendientes sin tocar la base a mano.

- `GET` listado y detalle.
- Tab Facturas, filtros mes/año, estados, modal.
- Botón Reintentar cableado al servicio de la Fase 2.
- Caso de ventana de fechas vencida: mostrar el texto de ARCA (típico 10016), no reintentar en bucle.

**Listo cuando:** una factura `pending` de homo se autoriza desde la pestaña, y una `rejected` muestra el motivo.

### Fase 4 — Reimpresión y PDF

**Objetivo:** el comprobante autorizado se puede volver a sacar sin Internet.

- `POST .../print` con layout fiscal completo y QR. Prueba en la térmica del local.
- `GET .../pdf` con pdfkit. QR con una librería de generación (a agregar; pdfkit ya está).
- Ambos leen solo `snapshot` + columnas fiscales. Probar después de un archivado: la orden ya no está en `orders` y el PDF sigue saliendo.
- Acciones de la grilla habilitadas solo en `authorized`.

**Listo cuando:** se descarga el PDF con la red desconectada y el QR escanea al formato esperado; la reimpresión sale por la térmica con CAE y QR legible.

### Fase 5 — Email

**Objetivo:** guardar el correo y enviarlo cuando haya red.

- `PATCH` email y `POST` send.
- Transporte SMTP por entorno. Adjunto = el mismo PDF de la Fase 4.
- UI: diálogo de email y botón Enviar.
- Fallo de SMTP no borra el email ni el CAE.

**Listo cuando:** un envío de prueba llega con el PDF, y un SMTP mal configurado deja la factura autorizada y el email guardado.

### Fase 6 — Producción

**Objetivo:** el primer comprobante real, controlado.

- Certificado de producción, punto de venta real, `AFIP_ENV=produccion`.
- Checklist: NTP, salida 443, backup de la clave, la clave no está en git.
- Una factura de monto mínimo acordado con el contador, consulta con `FECompConsultar`, PDF y ticket confrontados con ese CAE.
- Dejar homologación como modo por defecto en desarrollo.

**Listo cuando:** el contador da por válido ese comprobante (número, CAE, QR, importes).

## 10. Qué no hacer en estas fases

- No poner la clave ni el certificado en el frontend, en logs ni en el backup JSON de órdenes.
- No emitir el CAE dentro de la transacción de `closeOrder`.
- No reimprimir ni generar PDF fiscal si `status !== authorized`.
- No crear una segunda fila de `invoices` para la misma orden.
- No acoplar el listado a `daily_cash`: el filtro pedido es mes/año del comprobante. La orden ya tiene `dailyCashId` si más adelante se quiere cruzar.
- No implementar nota de crédito, Factura A/C ni controlador fiscal hasta cerrar las dudas 1 y 6.

## 11. Verificación

Además de los tests de la Fase 2:

- Cobro con switch apagado: no hay fila en `invoices` y el ticket de cuenta no cambia.
- Cobro con switch encendido y ARCA OK: una fila `authorized`, ticket fiscal, mesa libre.
- Timeout: fila `pending`, orden cerrada, un solo `cbteNro`.
- Reintento después de un timeout en el que ARCA sí autorizó: el mock de `FECompConsultar` devuelve el CAE y no se llama otra vez a `FECAESolicitar`.
- Archivado: PDF y detalle siguen disponibles.
- Roles: Mozo recibe 403 en `/invoices` y no ve la pestaña (la ruta de cajas ya lo impide).
- Smoke en la notebook del local, en homologación, con la impresora prendida y con la impresora apagada.

La UI (switch, pestaña, PDF descargado, mail) se prueba en el navegador de la notebook, no solo con tests, cuando esas fases estén implementadas.
