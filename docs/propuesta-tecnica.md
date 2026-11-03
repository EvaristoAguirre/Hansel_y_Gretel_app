# Propuesta técnica — Facturación electrónica (Factura B)

Plan de diseño para el gestor de restaurante (NestJS + TypeORM + PostgreSQL en la notebook, Next.js en la LAN). La descripción funcional está en `propuesta-cliente.md`. El marco de ARCA está en `api-arca-requerimientos.md`. El orden de construcción está en `plan-implementacion.md`.

Las confirmaciones del cliente (sección 9 de `propuesta-cliente.md`) ya están incorporadas. Lo que sigue abierto no bloquea el desarrollo y está listado en la sección 10.

---

## 1. Decisiones cerradas

1. **El emisor es Responsable Inscripto.** Comprobante: Factura B, `CbteTipo` 6. El mozo no factura. Roles: Admin y Encargado, igual que la caja.
2. **El backend de la notebook es el único cliente de ARCA.** SOAP sobre HTTPS saliente (puerto 443). La LAN tablet ↔ notebook sigue en HTTP. La tablet nunca ve el certificado ni la clave privada.
3. **Una orden cerrada produce como máximo una factura.** El pago parcial por productos y el pago con varios medios siguen siendo un solo `closeOrder`. El switch no parte el comprobante. Una orden cobrada con el switch apagado no se factura después.
4. **El cobro no espera a ARCA para liberar la mesa.** La transacción de caja commitea primero; la autorización corre después, con timeout. Un fallo de red no revierte el cobro.
5. **La factura no depende de la fila de `orders`.** El archivado semanal copia la orden a `archived_orders` (mismo UUID) y borra la original. La factura de una mesa guarda `orderId` como UUID sin FK. La factura manual no tiene orden.
6. **Importe fiscal = consumo − descuento. La propina no entra.** Sale de `orders.total`, `discountAmount` y `tip`, que `closeOrder` ya separa. No reutilizar el cálculo del ticket térmico: `printTicketOrder` estima una propina del 10 % para imprimir y no es la base fiscal.
7. **Precios con IVA incluido. La carta puede tener más de una alícuota.** WSFEv1 ya manda un array `Iva`, así que varias alícuotas no cambian el cliente SOAP ni la máquina de estados: el cálculo agrupa las líneas y manda un ítem de IVA por grupo. Cada producto tiene su porcentaje, o ninguno. Si no tiene, se usa el default de entorno (21 %). Los toppings con cargo entran en el subtotal de la línea y heredan la alícuota del producto. Exento y no gravado quedan fuera de esta versión: toda alícuota de esta versión es gravada.
8. **Receptor fijo:** consumidor final. `DocTipo` 99, `DocNro` 0. El id de `CondicionIVAReceptorId` se toma de `FEParamGetCondicionIvaReceptor` en homologación y se deja en configuración.
9. **El ticket de cuenta y la factura se imprimen en pasos distintos.** El paso 3 del stepper (Productos confirmados, `markOrderAsPendingPayment`) ya imprime el ticket de cuenta para llevar a la mesa. Ese camino no se toca. En el paso 4 (Pago) se imprime únicamente el ticket fiscal, y solo si ARCA autorizó. Si el switch está apagado, o si la factura queda pendiente o rechazada, el cobro no imprime nada: el ticket de cuenta ya salió en el paso 3, y un comprobante sin CAE no se imprime.
10. **El email se carga en el cobro y en el listado.** En `Pay.tsx`, un ícono abre un input. El valor viaja en el cierre y se guarda en la factura. En el listado se puede corregir y, si la factura está autorizada, enviar el PDF.
11. **No hay nota de crédito.** Una factura con CAE no se anula ni se borra desde el sistema.
12. **Hay un generador manual.** Una vista en Cajas de registro carga líneas y emite una Factura B sin abrir mesa, sin orden y sin movimiento de caja. Comparte numeración, estados, PDF, reimpresión y email con la factura de mesa.
13. **Reimprimir y el PDF no llaman a ARCA.** Usan la foto local. Solo una factura autorizada se imprime o se descarga como comprobante. Reintentar sí llama a ARCA (o al simulador), y antes consulta el comprobante para no duplicar.
14. **Dos variables eligen cómo se factura.** `AFIP_ENV` elige el ambiente de ARCA. `AFIP_SIMULATE` evita la red y devuelve un CAE ficticio. El servicio de facturas no distingue los dos caminos: solo cambia la implementación de `ArcaClient`.

## 2. Arquitectura

```
Encargada (Pay.tsx)                Pestaña Facturas
        |                          listado | nueva factura
        | POST /order/:id/close           | GET/POST /invoices...
        v                                  v
   OrderService.closeOrder          InvoiceController
        |                                  |
        | commit cobro                     |
        v                                  v
   InvoiceService.solicitar() -------> ArcaClient
        |                          simulador | WSAA + WSFEv1
        v                                  |
   tabla invoices  <---- CAE / error ------+
        |
        +---- PrinterService.ticket fiscal (solo si autorizado, solo en el cobro o al reimprimir)
        +---- PDF on demand (pdfkit + QR)
        +---- mail con PDF adjunto
```

Módulo nuevo `backend/src/Invoice/`:

| Pieza | Responsabilidad |
|---|---|
| `AfipConfig` | Lee el entorno al arrancar, resuelve las URLs del ambiente y corta el proceso si la combinación es inválida |
| `ArcaClient` | Contrato: último número, solicitar CAE, consultar, dummy y parámetros. Sin reglas de restaurante |
| `ArcaSimulator` | Implementación local. No abre sockets. Numeración y CAE ficticios |
| `ArcaWsfeClient` | TRA, firma CMS, `loginCms`, caché del TA, métodos WSFEv1. Se usa cuando la simulación está apagada |
| `InvoiceService` | Armar el comprobante, numeración, estados, reintento, foto de ítems. Igual para mesa y para carga manual |
| `InvoiceCalculator` | Función pura de importes y desglose de IVA |
| `InvoicePdfService` | PDF con los datos obligatorios y el QR |
| `InvoiceMailService` | Envío del PDF. No reutilizar `NotificationService`: hoy tiene Gmail y una contraseña de aplicación hardcodeados como placeholder |
| `InvoiceController` | Listado, detalle, alta manual, reintento, PDF, email, reimpresión. Roles Admin y Encargado |

Librería SOAP: se evalúa una que firme en la notebook con la clave local (candidato: `afip.ts` u otra equivalente mantenida). No usar un SaaS que se quede con la clave privada. El resto del módulo habla solo con `ArcaClient`.

## 3. Ambientes y simulación

`AFIP_ENV` selecciona el ambiente. Las URLs viven en un mapa en código, no se pegan a mano.

| `AFIP_ENV` | WSAA | WSFEv1 |
|---|---|---|
| `homologacion` | `https://wsaahomo.afip.gov.ar/ws/services/LoginCms` | `https://wswhomo.afip.gov.ar/wsfev1/service.asmx` |
| `produccion` | `https://wsaa.afip.gov.ar/ws/services/LoginCms` | `https://servicios1.afip.gov.ar/wsfev1/service.asmx` |

`AFIP_SIMULATE` es la flag del proceso.

| `AFIP_SIMULATE` | `AFIP_ENV` | Qué hace el proceso al arrancar |
|---|---|---|
| `true` o ausente | `homologacion`, vacío o ausente | Arranca sin certificado y sin red. `ArcaClient` es el simulador. Si la variable no está, se toma `true` para que un despliegue que todavía no la definió no llame a ARCA |
| `true` | `produccion` | No arranca |
| `false` | `homologacion` o `produccion` | Exige CUIT, punto de venta, certificado y clave. Habla con ese ambiente |
| `false` | otro valor o ausente | No arranca |

`AFIP_SIMULATE` no depende de `NODE_ENV`. En el local, `NODE_ENV=production` es lo que habilita la térmica; tiene que poder imprimirse un ticket fiscal de prueba.

`AFIP_SIMULATE_RESULT` solo se lee con la flag encendida. Valores: `authorized` (default), `rejected`, `timeout`. Sirve para recorrer los tres avisos del cobro sin ARCA.

Reglas del simulador:

- No llama a WSAA ni a WSFEv1 y no lee el certificado.
- Asigna `cbteNro` con el máximo local de ese `afipEnv` + punto de venta + tipo, más uno.
- `authorized`: CAE de 14 dígitos ficticio y vencimiento a 10 días.
- `rejected`: la fila queda `rejected` con un motivo fijo y legible.
- `timeout`: no devuelve CAE. La consulta posterior responde “no existe”, así que la fila queda `pending`.
- Cada fila guarda `afipEnv = simulado`. El ticket, el PDF y el listado lo muestran como comprobante sin validez fiscal.
- El índice único de numeración incluye `afipEnv`, así un número de prueba no choca con el de homologación ni con el de producción.
- Reintentar una fila `simulado` con la flag apagada responde 409. No se reenvía ese número a ARCA.

En `.env.example` el default de desarrollo es `AFIP_SIMULATE=true` y `AFIP_ENV=homologacion`.

## 4. Base de datos

Migración TypeORM nueva. Importes en `numeric`, nunca `float`.

### 4.1. `invoices`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `origin` | enum | `order` o `manual` |
| `orderId` | uuid, nullable | Solo `origin = order`. Mismo id en `orders` o, después del archivado, en `archived_orders` |
| `afipEnv` | enum | `simulado`, `homologacion`, `produccion`. El valor con el que se emitió, no el del proceso actual |
| `status` | enum | `pending`, `authorized`, `rejected` |
| `ptoVta` | int | Copiado de la config al emitir |
| `cbteTipo` | int | 6 |
| `cbteNro` | int, nullable | Se asigna al armar el request |
| `cbteFch` | date | Día en que se pidió la factura (fecha local). Es la que se manda a ARCA y la del filtro del listado |
| `concepto` | int | `AFIP_CONCEPTO`, default 1 Productos |
| `docTipo` / `docNro` | int | 99 / 0 |
| `condicionIvaReceptorId` | int | |
| `impTotal` / `impNeto` / `impIva` / `impTotConc` / `impOpEx` / `impTrib` | numeric(14,2) | Los tres últimos en 0 |
| `iva` | jsonb | Un objeto por alícuota. Ver 4.4 |
| `discountAmount` | numeric(12,2) | Informativo |
| `tipExcluded` | numeric(12,2) | Informativo. En la factura manual es 0 |
| `cae` | varchar, nullable | |
| `caeFchVto` | date, nullable | |
| `resultado` | char, nullable | `A` o `R` del último intento |
| `arcaErrors` | jsonb, nullable | `Errors` y `Observaciones` del último intento |
| `customerEmail` | varchar, nullable | Puede venir del cobro o cargarse después |
| `emailSentAt` | timestamptz, nullable | |
| `snapshot` | jsonb | Ítems y emisor. Ver 4.3 |
| `attemptCount` | int | |
| `lastAttemptAt` | timestamptz, nullable | |
| `authorizedAt` | timestamptz, nullable | |
| `createdAt` / `updatedAt` | timestamptz | |

Índice único parcial: `(orderId)` donde `orderId` no es nulo.

Índice único: `(afipEnv, ptoVta, cbteTipo, cbteNro)` donde `cbteNro` no es nulo.

Índice de listado: `(cbteFch)`.

### 4.2. `afip_tokens`

Una fila por servicio y ambiente (`wsfe` + `homologacion` o `produccion`): `token`, `sign`, `expirationTime`. Se reutiliza hasta el vencimiento (12 h). Pedir otro TA vigente hace fallar WSAA. Sobrevive a un reinicio del proceso. El simulador no escribe en esta tabla.

### 4.3. Foto (`snapshot`)

Se escribe al crear la factura, antes de llamar a ARCA, para que el PDF y la reimpresión no dependan de productos renombrados ni del archivado.

```json
{
  "origin": "order",
  "tableName": "5",
  "lines": [
    { "name": "Café con leche", "quantity": 2, "unitaryPrice": 2500, "subtotal": 5000, "alicQuota": 21 }
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

En una factura manual `tableName` es null y `origin` es `manual`. Las líneas de una orden salen del mismo criterio que el ticket actual (`buildProductLines`): unidades activas, toppings con cargo visibles, subtotal alineado con el consumo de la orden. La alícuota de la línea es la del producto, o el default.

### 4.4. Desglose de IVA (`iva`)

```json
[
  { "id": 5, "quota": 21, "baseImp": 7438.02, "importe": 1561.98 }
]
```

`id` es el de `FEParamGetTiposIva`. El mapa porcentaje → id vive en un solo archivo y se verifica en homologación antes de apagar la simulación. `impNeto` e `impIva` de la fila son la suma del array.

### 4.5. Producto

Columna nueva en `products`: `alicQuota numeric(5,2)`, nullable. Null significa “usar el default del entorno”. El formulario de producto (`ProductCreationModal`) ofrece las alícuotas gravadas que devuelva el parámetro de ARCA; hasta esa verificación, la lista inicial es 0, 2,5, 5, 10,5, 21 y 27. No se guarda el id de ARCA en el producto: el porcentaje es el dato estable y el id se resuelve al emitir.

### 4.6. Configuración

Variables de entorno, no tabla editable desde la UI. Documentarlas en `backend/.env.example` sin secretos.

| Variable | Uso |
|---|---|
| `AFIP_SIMULATE` | `true` o `false`. Flag de simulación. Ver sección 3 |
| `AFIP_SIMULATE_RESULT` | `authorized`, `rejected` o `timeout`. Solo con la flag encendida |
| `AFIP_ENV` | `homologacion` o `produccion`. Elige el par de URLs |
| `AFIP_CUIT` | CUIT del emisor, sin guiones. Obligatorio con la simulación apagada |
| `AFIP_PTO_VTA` | Punto de venta electrónico |
| `AFIP_CERT_PATH` / `AFIP_KEY_PATH` | Archivos fuera del repo. Obligatorios con la simulación apagada. Permisos de lectura solo para el usuario que corre el backend |
| `AFIP_ALICUOTA_DEFAULT_PCT` | Porcentaje cuando el producto no tiene alícuota. Propuesta: 21 |
| `AFIP_CONDICION_IVA_RECEPTOR_ID` | Consumidor final, id verificado en homologación |
| `AFIP_CONCEPTO` | 1 Productos, salvo que el contador indique otro |
| `AFIP_RAZON_SOCIAL`, `AFIP_DOMICILIO`, `AFIP_IIBB`, `AFIP_INICIO_ACTIVIDADES` | Pie de ticket y PDF |
| `AFIP_TIMEOUT_MS` | Timeout de cada llamada real. Propuesta: 8000. Un intento. El reintento es manual desde el listado |
| `SMTP_*` | Recién en el paso de email. Host, puerto, usuario, clave de aplicación, remitente |

El certificado de homologación y el de producción no se mezclan. Con la simulación apagada, el arranque loguea el ambiente elegido. Cambiar de ambiente implica cambiar el par cert/clave; si el archivo no está, el proceso no arranca.

## 5. Cálculo del comprobante

`InvoiceCalculator` recibe líneas `{ subtotal, alicQuota }`, el descuento y no recibe la propina.

```
consumo          = suma de subtotales
netoConIva       = consumo - descuento
impTotal         = netoConIva
```

Si `netoConIva <= 0`, no se crea la factura. En el cobro, el request se rechaza con “No se puede facturar un importe cero” antes de cerrar la orden. En el generador manual, el POST se rechaza igual y no queda fila.

Agrupar por `alicQuota`. El descuento se reparte en proporción al subtotal de cada grupo, redondeado a dos decimales; el último grupo absorbe la diferencia para que la suma de los descuentos sea exactamente `discountAmount`.

```
base_g   = subtotal_g - descuento_g
impNeto  = round(base_g / (1 + quota/100), 2)
impIva   = round(base_g - impNeto, 2)
```

Ajustar el centavo del grupo de mayor base para que la suma de netos más la suma de IVA sea `impTotal`. `ImpTotConc`, `ImpOpEx` e `ImpTrib` en 0. Moneda `PES`, cotización 1. El array `Iva` lleva un ítem por grupo con base mayor a 0.

En el pago parcial el descuento hoy no se envía (`discountPercent` queda 0). El importe facturado es el consumo de esa orden, sin propina.

`CbteDesde` = `CbteHasta` = último número + 1, del simulador o de `FECompUltimoAutorizado` según la flag.

## 6. Máquina de estados y reintento

```
crear fila pending + cbteNro + afipEnv
        |
        v
   solicitar CAE
     |         |
     A         R
     |         |
authorized   rejected
     |
timeout o sin respuesta
     |
consultar(ptoVta, cbteTipo, cbteNro)
     |                    |
  existe con CAE      no existe
     |                    |
authorized            sigue pending
```

Reglas:

- Lock en proceso (mutex por `afipEnv` + `ptoVta` + `cbteTipo`) para que un cobro y un alta manual simultáneos no lean el mismo último número. El unique de la tabla es la red de seguridad.
- Nunca un segundo solicitar si la consulta devolvió CAE.
- `Reproceso = S` en la respuesta real se trata como autorización ya hecha: persistir ese CAE.
- Una fila `simulado` no se reintenta contra ARCA.
- `FEDummy` no bloquea el cobro. Si se quiere un aviso previo, puede llamarse al abrir la pantalla de pago, con el resultado cacheado un par de minutos. Si falla, el switch sigue disponible y la factura nacerá `pending`.

ARCA acepta la fecha del comprobante dentro de una ventana de pocos días respecto del día en que se procesa (cinco días si el concepto es productos). Si una pendiente se reintenta fuera de esa ventana, se muestra el texto de ARCA (típico 10016) y no se reintenta en bucle.

## 7. API

Todas con `RolesGuard`, roles `Admin` y `Encargado`. Respuestas de error en español, igual que el resto de la API.

### Cobro

`POST /order/:id/close` suma campos opcionales:

```json
{ "invoice": true, "customerEmail": "cliente@correo.com" }
```

`invoice` default `false`. `customerEmail` se ignora si `invoice` no es true. Si viene, se valida el formato y se guarda al crear la fila.

Orden interna de `closeOrder`:

1. Validar el importe fiscal si `invoice` es true. Importe cero: 400 y la orden no se cierra.
2. Transacción actual de cobro.
3. Commit.
4. Si `invoice` es true: crear `invoices` en `pending` y disparar la autorización. Un fallo de ARCA no devuelve 500.
5. La respuesta agrega:

```json
{
  "invoice": {
    "id": "...",
    "status": "authorized | pending | rejected",
    "cbteNro": 123,
    "cae": "...",
    "afipEnv": "simulado | homologacion | produccion",
    "message": "texto para el Swal"
  }
}
```

6. Impresión, después del resultado:
   - `authorized`: ticket fiscal.
   - `pending`, `rejected` o switch apagado: no se imprime en este paso.
   - El fallo de la térmica no cambia el estado de la factura. Se reimprime desde el listado.

### Facturas

| Método | Uso |
|---|---|
| `GET /invoices?month=&year=` | Listado del mes, por `cbteFch` descendente. Incluye `origin`, estado, email y `afipEnv` |
| `GET /invoices/:id` | Detalle, foto, desglose de IVA y `arcaErrors` |
| `POST /invoices` | Alta manual. Body en la sección 8.3. Misma máquina de estados |
| `POST /invoices/:id/retry` | Solo `pending` o `rejected`, y solo si `afipEnv` coincide con el modo actual |
| `POST /invoices/:id/print` | Solo `authorized`. Ticket fiscal |
| `GET /invoices/:id/pdf` | Solo `authorized`. `Content-Disposition: attachment` |
| `PATCH /invoices/:id/email` | Body `{ "email": "..." }`. Valida formato. No envía |
| `POST /invoices/:id/send-email` | Solo `authorized` y con email. Adjunta el PDF. Si falla, 502 y no borra el email. Si sale, setea `emailSentAt` |

No hay `DELETE`.

## 8. Frontend

### 8.1. Cobro — `frontend/components/Order/Pay.tsx`

Visible en modo total y en modo parcial, junto al botón que dispara `handlePayOrder`.

- Switch “Emitir Factura B”, apagado por defecto.
- Texto con el importe a facturar (consumo − descuento, sin propina).
- Ícono de email. Al clickearlo se abre un input. El valor se manda como `customerEmail` dentro de `orderToClosed` (`frontend/api/order.ts`) solo si el switch está encendido.
- Se manda `invoice: true` con el switch encendido.
- El `Swal` distingue los tres estados. En `pending` y `rejected` el título deja claro que la orden sí se cobró, y que en este paso no salió comprobante fiscal.
- El switch no se ofrece si la orden no está en `pending_payment`.

El ticket de cuenta del paso 3 queda como está, en `markOrderAsPendingPayment`.

### 8.2. Pestaña Facturas — `PanelDailyCash.tsx`

Cuarta tab, “Facturas”, en la ruta ya protegida (`Admin`, `Encargado`).

- Filtros mes y año con MUI, default mes actual. Misma línea visual que `DailySalesView` (DataGrid).
- Columnas: fecha, comprobante (punto de venta con 4 dígitos + número con 8), origen (Mesa o Manual), importe, estado, email, y una marca cuando `afipEnv` es `simulado`.
- Acciones por fila según estado (la matriz está en `propuesta-cliente.md`). Botones deshabilitados con tooltip, para que se entienda que reimprimir exige CAE.
- Modal de detalle: foto, CAE, vencimiento, desglose de IVA, QR en pantalla si está autorizada, observaciones si las hay.
- Reintentar pide confirmación y refresca la fila.
- Descargar PDF con el token en el header, no en la URL.
- Guardar email: diálogo con un campo. Enviar: confirmación y aviso de éxito o de fallo de correo.
- Botón “Nueva factura” abre el generador.

Estado vacío: “No hay facturas en ese mes”.

### 8.3. Generador manual

Vista dentro de la pestaña Facturas. No crea orden, no toca la mesa y no escribe en la caja diaria.

- Líneas: concepto, cantidad, precio unitario, alícuota (default 21 %). Una línea puede nacer de un producto del catálogo, que completa nombre, precio y alícuota; se puede editar antes de emitir.
- Descuento en pesos, default 0. Importe a facturar visible.
- El mismo ícono de email.
- Emitir llama a `POST /invoices` y muestra el mismo resultado que el cobro: autorizada, pendiente o rechazada.
- La fila aparece en el listado del mes con origen Manual.

### 8.4. Ticket fiscal

Método nuevo en `PrinterService`, aparte de `printTicketOrder`. Papel 80 mm, ESC/POS, misma impresora (`PRINTER_HOST` / `PRINTER_PORT`).

Contenido mínimo:

- Razón social, domicilio, CUIT, condición IVA, IIBB, inicio de actividades
- “FACTURA B”, punto de venta y número
- Fecha
- Ítems, alícuota de cada línea si hay más de una, y descuento (de la foto)
- Total
- “Consumidor final”
- IVA contenido, una línea por elemento de `iva`
- CAE y vencimiento del CAE
- QR según la RG 4892: JSON en base64 con `ver`, `fecha`, `cuit`, `ptoVta`, `tipoCmp`, `nroCmp`, `importe`, `moneda`, `ctz`, `tipoDocRec`, `nroDocRec`, `tipoCodAut` = `E`, `codAut` = CAE. URL `https://www.afip.gob.ar/fe/qr/?p=<base64>`
- Si `afipEnv` es `simulado`: leyenda visible de comprobante sin validez fiscal

El QR en térmica se prueba con la impresora del local. Si el comando QR nativo no es fiable, se imprime la imagen raster del QR. El PDF no tiene ese problema.

En `NODE_ENV !== production` no se manda nada a la térmica; se loguea el contenido.

### 8.5. Alícuota en el producto

`ProductCreationModal` suma un selector de alícuota gravada. Vacío significa default del entorno. El alta y la edición de producto persisten `alicQuota`.

## 9. Qué no entra en este desarrollo

- Nota de crédito, Factura A, Factura C y controlador fiscal.
- Facturar más tarde una orden cobrada con el switch apagado.
- Pedir DNI o CUIT.
- Exento y no gravado.
- Movimiento de caja desde el generador manual.
- Imprimir el ticket de cuenta otra vez en el paso 4.
- Poner la clave o el certificado en el frontend, en logs o en el backup JSON de órdenes.
- Emitir el CAE dentro de la transacción de `closeOrder`.
- Reimprimir o generar PDF fiscal si `status !== authorized`.
- Una segunda fila de `invoices` para la misma orden.
- Atar el listado a `daily_cash`. El filtro es mes y año de `cbteFch`.

## 10. Lo que sigue abierto

No bloquea los pasos del plan. Cada uno tiene un default.

| Tema | Default mientras no haya otra respuesta |
|---|---|
| Porcentajes reales de la carta | 21 % en todo producto sin alícuota cargada. El selector ya permite otro valor |
| Concepto del comprobante | 1 Productos (`AFIP_CONCEPTO`) |
| Ids de alícuota y de condición IVA receptor | Se confirman con los parámetros de homologación y se fijan en el mapa y en el entorno |
| QR nativo o imagen en la térmica | Se prueba con la impresora del local, en el paso del ticket |
| Casilla SMTP | El envío de mail espera esas variables. Guardar el email y bajar el PDF no |

## 11. Verificación

Además de los tests del cálculo y de la máquina de estados:

- Cobro con switch apagado: no hay fila en `invoices` y el paso 4 no imprime.
- Cobro con switch encendido y resultado autorizado: una fila `authorized`, ticket fiscal, mesa libre, email guardado si se cargó.
- Timeout: fila `pending`, orden cerrada, un solo `cbteNro`, nada impreso en el paso 4.
- Reintento después de un timeout en el que ARCA sí autorizó: la consulta devuelve el CAE y no se vuelve a solicitar.
- Dos emisiones simultáneas (cobro y alta manual) no repiten número.
- Dos alícuotas en la misma orden: el array `iva` tiene dos ítems y `impNeto + impIva = impTotal`.
- Archivado: PDF y detalle siguen disponibles.
- Generador manual: factura sin `orderId`, visible en el listado, sin fila nueva en caja.
- Simulación apagada contra producción no arranca si falta el certificado. Simulación encendida con `AFIP_ENV=produccion` no arranca.
- Roles: Mozo recibe 403 en `/invoices` y no ve la pestaña.

La UI (switch, ícono de email, pestaña, generador, PDF, mail) se prueba en el navegador de la notebook cuando esos pasos estén implementados. Con `AFIP_SIMULATE=true` se puede recorrer el flujo entero antes de tener el certificado de homologación.
