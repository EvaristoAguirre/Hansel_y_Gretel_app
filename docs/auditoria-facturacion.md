# Auditoría de facturación

Fecha: 3 de noviembre de 2026  
Alcance: Factura B electrónica (ARCA / WSFEv1), cierre de orden, factura manual, PDF, ticket fiscal, correo y tests.

## Resumen

El flujo cobra la orden y después pide el CAE. Si ARCA no responde, la orden queda cobrada y la factura queda pendiente o rechazada. Esa decisión es correcta para el salón. El problema está en lo que pasa después: un rechazo o un timeout quema el número en la base local y el comprobante siguiente pide un número que ARCA todavía no espera. A partir de ahí las facturas nuevas se rechazan en cadena.

Hay un segundo desvío de dinero. La caja redondea el consumo al peso para calcular descuento y propina. La factura usa los centavos de las líneas, y cuando hay toppings con cargo vuelve a redondear el precio unitario al peso. El importe autorizado puede no coincidir con lo cobrado ni con el texto “Se factura $…” de la pantalla de pago.

Los tests de facturación pasan. Cubren el camino feliz, un timeout, el rechazo simple y la concurrencia dentro de un solo proceso. No cubren el hueco de numeración, el desajuste de importes ni la recuperación de un pendiente después de emitir otro comprobante.

## Cómo está armado

1. El cajero cierra la orden con `invoice: true` (`OrderService.closeOrder`).
2. Antes de cobrar se rechaza un neto fiscal de cero (`assertInvoiceable` + `previewFiscalTotal`).
3. Se confirma el cobro, la propina y el descuento (`OrderRepository.closeOrder`). La propina no entra en la factura.
4. `InvoiceService.emitForOrder` arma las líneas, calcula IVA, reserva el número y llama a ARCA.
5. Si el CAE llega, se imprime el ticket fiscal. El ticket de cuenta no se imprime en ese camino.
6. PDF, reimpresión, reintento y mail salen de `InvoiceController` (`/invoices`), solo para admin y encargado.

La factura manual (`POST /invoices`) usa el mismo pedido a ARCA y no crea orden ni movimiento de caja.

Modos: `simulado` (default si `AFIP_SIMULATE` no está), `homologacion` y `produccion`. Simulado junto con producción no arranca.

Estados locales: `pending`, `authorized`, `rejected`. Tipo de comprobante fijo: 6 (Factura B). Receptor fijo: `DocTipo` 99, `DocNro` 0.

## Hallazgos

### 1. Crítico — un rechazo o un pendiente desalinean la numeración

`nextNumber` pide el último autorizado a ARCA y el máximo local, y usa el mayor de los dos más uno. El máximo local incluye pendientes y rechazados.

ARCA solo avanza el último autorizado cuando el comprobante sale aprobado. Un rechazo deja el número libre. El código ya lo guardó. La factura siguiente se salta ese número.

Ejemplo:

| Paso | Qué pasa | Último en ARCA | Próximo que pide la app |
| --- | --- | --- | --- |
| Factura 5 rechazada por un dato inválido | Queda `rejected` con número 5 | 4 | 6 |
| Factura 6 | ARCA espera el 5 | 4 | Falla por no ser correlativa |
| Reintento de la 6 | Vuelve a pedir el 6 | 4 | Sigue fallando |

El reintento de la 5 puede destrabar la serie, porque reenvía el mismo número. El reintento manda el mismo payload guardado: si el rechazo fue por un dato que después se corrigió en el entorno (condición de IVA, alícuota default), la fila vieja sigue enviando el valor viejo.

Mientras exista un hueco, cada emisión nueva agranda el hueco. Una sola factura rechazada puede frenar toda la facturación hasta que alguien reintente las filas en orden y ARCA acepte ese número.

El mismo patrón ocurre con un `pending` cuyo CAE no llegó a guardarse y ARCA no lo autorizó. Si ARCA sí lo autorizó, saltar al siguiente es válido. El código no distingue los dos casos antes de emitir otra factura.

Archivos: `backend/src/Invoice/invoice.service.ts` (`nextNumber`, `persistAndRequest`, `retryLocked`).

### 2. Crítico — el reintento puede dar por rechazado un comprobante que ya tiene CAE

En la primera emisión, si `solicitar` da timeout, se consulta el número antes de dejarlo pendiente. Eso está bien.

En el reintento de un pendiente:

1. Se consulta.
2. Si la consulta falla, el error se traga y se vuelve a solicitar.
3. Si esa solicitud vuelve rechazada, la fila pasa a `rejected`.

Un rechazo ya no se consulta en el reintento siguiente. Si el CAE existía y la consulta falló por red o por el token, el reintento puede pisar el estado y después no volver a buscar el CAE.

La consulta tampoco compara el importe ni la fecha del comprobante devuelto con la fila local. Un CAE de ese número se acepta tal cual.

### 3. Alto — el importe facturado no es el importe cobrado

Hay tres redondeos distintos.

**Caja y pantalla de pago.** El consumo se redondea al peso (`Math.round`). El descuento es un porcentaje de ese entero. La propina es la diferencia entre lo declarado y ese neto. El texto del switch usa ese neto entero (`fullNetAfterDiscount`).

**Factura.** `calculateInvoice` suma los subtotales en centavos y resta `order.discountAmount`, que es el descuento en pesos enteros.

Ejemplo: consumo $100,40 y 10 % de descuento.

- La pantalla dice que se facturan $90.
- El cliente paga $90 más la propina.
- La factura sale por $90,40.

**Toppings con cargo.** `buildProductLines` redondea cada precio unitario al peso (`Math.round(basePrice + extra)`) y la factura suma esos subtotales. La caja usa `detail.subtotal` original. Con toppings, la base fiscal y la base cobrada pueden diferir por pesos, no solo por centavos.

`assertInvoiceable` mira la suma de `detail.subtotal` redondeada al peso. La emisión mira las líneas reconstruidas. El control previo puede dejar pasar la orden y `calculateInvoice` puede tirar “importe cero” recién después del cobro. En ese caso no se guarda factura y la orden ya está cerrada.

En pago dividido el cierre manda `discountPercent: 0` aunque el modo total tuviera descuento, y el importe mostrado es `Math.round(fullBaseAmount)`. Ese total suma `unitaryPrice` y no lo multiplica por `quantity`. Si una línea tiene cantidad mayor a 1, el número del switch no es el total fiscal.

Archivos: `order.repository.ts` (cierre), `invoice-calculator.ts`, `order-response.helper.ts`, `Pay.tsx`.

### 4. Alto — si la emisión explota, la orden queda cerrada y sin factura recuperable

`emitForOrder` corre después del commit del cobro. Cualquier excepción se convierte en una respuesta de éxito con una factura ficticia:

- `id` vacío
- `status: pending`
- `afipEnv: 'simulado'` también en homologación y producción
- mensaje “La factura no pudo registrarse.”

Eso cubre alícuota desconocida, fallo de base, número duplicado y un error de cálculo. No queda fila, así que el listado no ofrece reintento. `emitForOrder` no está expuesto como endpoint. La única salida es una factura manual, suelta de la orden y de la caja.

Una alícuota que no está en el mapa lanza `Error`, no `InvoiceCalculationError`. El servicio solo traduce esta última a 409. `AFIP_ALICUOTA_DEFAULT_PCT` acepta cualquier número mayor o igual a 0: un 19 arranca el proceso y falla al facturar cada producto sin alícuota propia.

`AFIP_CONDICION_IVA_RECEPTOR_ID` puede quedar vacío. Se envía 0. ARCA rechaza ese id. Combinado con el hallazgo 1, el primer rechazo de producción frena los siguientes.

### 5. Alto — el receptor es siempre consumidor final sin documento

Todas las facturas salen con `DocTipo` 99 y `DocNro` 0. No hay DNI ni CUIT de cliente. ARCA rechaza la Factura B cuando el importe supera el tope vigente de identificación. El tope lo actualiza ARCA y acá no se consulta ni se pide el documento.

Tampoco hay nota de crédito ni anulación. Una Factura B autorizada con el importe mal (hallazgo 3) o con el cliente equivocado queda emitida. Una orden cerrada no se puede cancelar.

### 6. Medio — errores de ARCA se guardan como “pendiente” sin motivo

En `persistAndRequest`, cualquier excepción de `solicitar` (token, certificado, SOAP, CUIT faltante) se convierte en `{ outcome: 'timeout' }`. Si la consulta también falla, la fila queda `pending` y `arcaErrors` queda vacío. El salón ve “la factura quedó pendiente”, que invita a reintentar, y el log del servicio de orden no recibe ese error porque `emitForOrder` no lo relanza.

El cliente SOAP sí distingue timeout de otros fallos. Esa distinción se pierde en el servicio.

El mensaje de pendiente y de rechazo dice “La orden está cobrada” también en la factura manual, donde no hubo orden.

### 7. Medio — la fecha del comprobante usa la zona horaria del proceso

El TRA de WSAA se arma con `America/Argentina/Buenos_Aires`. `cbteFch` usa `new Date()` del servidor (`localIsoDate`). Si el proceso corre en UTC, después de las 21:00 en Argentina la factura lleva la fecha del día siguiente. El listado mensual parte la misma jornada en dos meses, y ARCA puede rechazar la fecha.

El reintento reenvía la `cbteFch` original. Un pendiente de un día anterior puede caer fuera de la ventana de fechas de ARCA.

### 8. Medio — concepto 2 o 3 se puede configurar y el XML no lo soporta

`AFIP_CONCEPTO` acepta 1, 2 o 3. El default es 1 (productos) y con eso el XML alcanza. Para servicios y productos+servicios ARCA exige `FchServDesde`, `FchServHasta` y `FchVtoPago`. Esos tags no se envían. Si alguien pone el concepto en 2 o 3, todas las emisiones se rechazan.

### 9. Medio — la factura manual no entra en la caja, y el precio del catálogo se deforma

Emitir a mano no registra cobro. Una venta hecha solo por esa pantalla queda en ARCA y no en el arqueo.

Al precargar un producto, el diálogo hace esto:

```ts
Number(String(product.price).replace(/\./g, "").replace(",", "."))
```

Si el API manda `1500.5` o `"1500.50"`, el punto decimal se borra y el precio pasa a 15005 o 150050. Un precio entero no se altera. El botón de emitir no se deshabilita: dos clics generan dos facturas.

### 10. Medio — el candado del número es solo de este proceso

`withLock` es un `Map` en memoria. Dos instancias (dos réplicas, o `nest start` más un worker) pueden pedir el mismo número. El índice único hace fallar a una. En el cierre de orden, ese fallo cae en el hallazgo 4: orden cobrada, sin factura.

Dentro de un solo proceso el candado sí serializa. El test de emisiones simultáneas cubre ese caso.

### 11. Bajo — otros huecos

- No hay marca de agua extra en el QR: el QR de un comprobante simulado u de homologación apunta al verificador de AFIP con un CAE ficticio o de prueba. El PDF y el ticket sí imprimen la leyenda “sin validez fiscal”.
- El nombre del PDF descargado es siempre `factura-b.pdf`.
- `docNro` es `integer`. Alcanza para el 0 actual. Un CUIT de 11 dígitos no entra en ese tipo de columna el día que se identifique al receptor.
- No hay nota de crédito, factura A, ni datos de servicio.
- El listado no pagina y mezcla ambientes si se cambió el modo y quedaron filas viejas. El reintento sí se niega si `afipEnv` no coincide con el modo actual.
- La impresión fiscal fallida deja la factura autorizada y un `printerWarning`. No hay test de ese camino. El pendiente no imprime ni ticket fiscal ni ticket de cuenta: el cliente se va sin papel hasta que alguien reimprime.

## Manejo de errores, por tramo

| Tramo | Qué hace | Qué le falta |
| --- | --- | --- |
| Cierre con neto fiscal 0 | 400 y la orden no se cobra | El control usa otro redondeo que la emisión |
| Cobro | Transacción propia. Si falla, no hay factura | Correcto |
| Emisión después del cobro | La excepción no deshace el pago | Se responde un pendiente falso, sin fila |
| Cálculo | 409 si es `InvoiceCalculationError` | Alícuota fuera de mapa es un 500 enmascarado |
| ARCA timeout | Consulta y, si hay CAE, autoriza | No compara importe |
| ARCA rechazo | Guarda código y texto | El número local queda ocupado |
| Otro error de red o de login | Se guarda como pendiente, sin motivo | El operador no ve la causa |
| Reintento | Solo `pending` y `rejected`, y solo el mismo modo | El rechazado no se consulta. La fecha no se actualiza |
| PDF / impresión | 409 si no está autorizada | Cubre el caso |
| Mail | Si SMTP falla, 502 y la factura sigue autorizada. `emailSentAt` se escribe solo si el envío salió | Un fallo al guardar la fecha puede reenviar |
| Validación HTTP | Mes/año inválidos, email, líneas manuales | El concepto y la condición de IVA no se validan contra lo que el XML puede mandar |

## Tests

### Qué se ejecuta

No hay workflow de CI que corra tests. En `.github` solo está Dependabot.

| Comando | Qué incluye |
| --- | --- |
| `pnpm test` en `backend` | Jest, todo `backend/src/**/*.spec.ts` |
| `pnpm test:e2e` | `backend/test/**/*.e2e-spec.ts`. No hay escenario de facturación |
| `pnpm test` en `frontend` | Vitest. No hay tests de facturación ni de la pantalla de pago |

El 3 de noviembre de 2026 se corrió:

```bash
cd backend && pnpm exec jest --testPathPattern='Invoice|order.service.close-invoice' --no-coverage
```

Resultado: 10 suites, 59 tests, todos verdes.

| Suite | Tests | Qué fija |
| --- | --- | --- |
| `afip-config.spec.ts` | 10 | Default simulado, URLs, CUIT, certificado, rechazo de simulado+producción |
| `invoice-calculator.spec.ts` | 5 | 21 %, dos alícuotas con descuento, default, importe cero, alícuota 19 |
| `arca-simulator.spec.ts` | 8 | CAE de 14, rechazo, timeout sin comprobante, reproceso, factory |
| `arca-wsfe-client.spec.ts` | 7 | TRA, token cacheado, rechazo, consulta 602, timeout de red, log de hora |
| `invoice.service.spec.ts` | 10 | Autorizar, rechazar, timeout con y sin CAE, dos números en paralelo, una factura por orden, reintento, PDF con dos alícuotas, manual, importe cero |
| `order.service.close-invoice.spec.ts` | 4 | No cerrar si el neto es 0, cobrar y después facturar, no imprimir si queda pendiente, switch apagado |
| `invoice-pdf.spec.ts` | 6 | Leyendas, QR tipo 6 y doc 99, reimpresión, bloqueo de pendiente |
| `fiscal-ticket-print.spec.ts` | 3 | Leyenda y QR en la térmica |
| `invoice-mail.service.spec.ts` | 3 | SMTP fallido, envío con PDF, leyenda de producción |
| `invoice-format.spec.ts` | 2 | Fecha, importe, leyenda |

El test de concurrencia hace que el mock de ARCA avance el último autorizado cuando la solicitud tiene éxito. Por eso no ve el hueco del hallazgo 1. El simulador tampoco exige que el número sea el último más uno: en simulado la serie rota no aparece.

### Casos que los tests no prevén

Numeración y reintento:

- Rechazo y, después, otra orden: el número pedido y el que ARCA espera.
- Pendiente sin CAE y, después, otra orden.
- Reintento de un pendiente cuya consulta falla y cuya nueva solicitud viene rechazada, teniendo CAE del otro lado.
- Reintento de un rechazado cuando ya se emitió un número mayor.
- Dos procesos pidiendo número a la vez.
- Choque con el índice único durante el cierre.
- Excepción de `emitForOrder` después del cobro: respuesta con `id` vacío y `afipEnv` simulado.
- Fallo de la impresora con factura ya autorizada.
- Reintento que no actualiza la fecha del comprobante.

Importes:

- Consumo con centavos y descuento porcentual: cobrado contra `impTotal`.
- Toppings con `extraCost`: subtotal de caja contra subtotal facturado.
- `assertInvoiceable` deja pasar y `calculateInvoice` rechaza.
- Alícuota 0 %, 2,5 %, 5 % y 27 %, y un descuento que deja una alícuota en base cero.
- `AFIP_ALICUOTA_DEFAULT_PCT` fuera del mapa.
- `AFIP_CONDICION_IVA_RECEPTOR_ID` vacío (se envía 0).
- Concepto 2 o 3.
- Importe por encima del tope de consumidor final sin documento.
- Propina incluida por error en la base, o descuento mayor que un grupo de alícuota.

Operación:

- Factura manual: mensaje de “orden cobrada”, precio de catálogo con decimales, doble click, ausencia en la caja.
- Pago dividido con el switch de factura prendido y líneas con cantidad mayor a 1.
- Zona horaria del servidor distinta de Argentina, cerca de la medianoche.
- Mail: falta `SMTP_HOST`, factura sin email, reenvío.
- PDF de una fila leída de la base (fecha `date` de Postgres) contra el QR de la RG 4892.
- Controller: roles, mes inválido, UUID inválido. No hay test de `InvoiceController`.

## Qué conviene cambiar primero

1. Numerar con el último autorizado de ARCA más uno. No adelantar la serie por una fila `rejected`. No emitir un número nuevo mientras el anterior esté `pending`: primero consultar ese número.
2. En el reintento, consultar siempre antes de solicitar. Si la consulta devuelve CAE, autorizar la fila. Comparar importe y fecha. No pasar a `rejected` si la consulta no pudo hacerse.
3. Unificar el importe. Una sola base en centavos para cobro, pantalla y factura. El descuento y la propina tienen que salir de esa base. La factura tiene que usar los mismos subtotales que se cobraron, también con toppings.
4. Si la emisión falla después del cobro, persistir la fila (o un intento fallido ligado a la orden) y mostrar el error real. Sacar el `afipEnv: 'simulado'` fijo.
5. Exigir `AFIP_CONDICION_IVA_RECEPTOR_ID` cuando no se simula, y limitar la alícuota default al mapa de ARCA.
6. Definir el tope y el dato del receptor (DNI) antes de salir a producción con mesas grandes. Dejar anotado que no hay nota de crédito.
7. Calcular `cbteFch` en `America/Argentina/Buenos_Aires`.
8. Agregar los tests de la sección anterior, en este orden: numeración tras rechazo, importes con centavos y toppings, reintento que no pierde el CAE, excepción después del cobro.

## Referencia rápida de archivos

- `backend/src/Invoice/invoice.service.ts` — emisión, número, reintento, mensajes
- `backend/src/Invoice/invoice-calculator.ts` — IVA y descuento
- `backend/src/Invoice/arca-wsfe-client.ts` — SOAP, timeout, consulta
- `backend/src/Invoice/afip-config.ts` — modo y variables
- `backend/src/Order/services/order.service.ts` — cierre y factura
- `backend/src/Order/repositories/order.repository.ts` — descuento, propina, total cobrado
- `backend/src/Order/helpers/order-response.helper.ts` — líneas con toppings
- `frontend/components/Order/Pay.tsx` — switch e importe mostrado
- `frontend/components/Order/payTotals.ts` — base, descuento y neto de la pantalla de pago
- `frontend/components/DailyCash/TabInvoices/` — listado, manual, detalle

## Resolución

Fecha: 3 de noviembre de 2026  
Alcance aplicado: puntos 1, 2, 3, 4, 5 y 7 del apartado “Qué conviene cambiar primero”. El punto 6 (tope de consumidor final, DNI/CUIT del receptor y nota de crédito) queda fuera a propósito: se maneja fuera de la aplicación.

### Qué se resolvió

1. **Numeración.** El candidato es el último autorizado de ARCA más uno. Una fila `rejected` suelta el número (`cbteNro` null y `releasedCbteNro` en `arcaErrors`) para que la siguiente emisión lo reutilice. Mientras exista un `pending` con ese número, no se pide uno nuevo: primero se consulta; si hay CAE con el mismo importe y fecha se autoriza esa fila y se avanza; si no, la orden nueva queda con un intento sin número y el motivo.
2. **Reintento.** Pendiente y rechazada consultan siempre antes de solicitar. CAE coincidente → autoriza. Consulta fallida → no solicita y no pasa a `rejected` (código `CONSULTA`). CAE con otro importe o fecha → no autoriza ni solicita (`MISMATCH`). La misma comparación aplica al timeout de la primera emisión. `ArcaComprobante` ahora trae `cbteFch`.
3. **Importes.** Cobro, `previewFiscalTotal` y pantalla de pago usan centavos. Un consumo de $100,40 con 10 % deja descuento $10,04 y neto $90,36 (antes $90). `buildProductLines` deja de redondear el unitario al peso y ajusta el último grupo para que la suma coincida con `detail.subtotal`. Los montos de pago aceptan centavos (`formatCurrency` / `parseEsARNumber`).
4. **Fallo después del cobro.** Si el cálculo o la serie fallan, se persiste una fila `pending` ligada a la orden con `cbteNro` null, el modo real y el mensaje. Si ni eso se puede guardar, `closeOrder` responde el error real y `currentAfipEnv()` (ya no fuerza `simulado`). Una alícuota fuera del mapa es `InvoiceCalculationError` (409), no un 500 enmascarado. El mensaje “La orden está cobrada” solo aparece cuando `origin` es `order`.
5. **Configuración.** Con `AFIP_SIMULATE=false`, `AFIP_CONDICION_IVA_RECEPTOR_ID` es obligatorio y mayor a 0. `AFIP_ALICUOTA_DEFAULT_PCT` solo acepta 0, 2.5, 5, 10.5, 21 o 27.
7. **Fecha.** `cbteFch` se calcula con `America/Argentina/Buenos_Aires` (`argentinaIsoDate`).

**Tests agregados o ampliados:** numeración tras rechazo; pendiente que bloquea la serie; reintento que no pierde el CAE si la consulta falla; mismatch de importe; centavos y toppings; coincidencia `previewFiscalTotal` / `calculateInvoice`; excepción post-cobro; alícuota default y condición de IVA; fecha argentina; alícuotas 0/2.5/5/27 y grupo en base cero; `payTotals` en el frontend.

### Qué no se resolvió

- **Punto 6:** tope de identificación del receptor, carga de DNI/CUIT, nota de crédito, factura A.
- **Hallazgo 6 (parcial):** los errores de red/login de `solicitar` que no son timeout siguen entrando por el camino de “timeout + consulta”; ahora se puede guardar un mensaje en `arcaErrors` si `solicitar` lanza, pero la distinción fina timeout vs otro fallo del cliente SOAP no se propaga completa al operador.
- **Concepto 2 o 3:** siguen sin enviarse `FchServDesde`, `FchServHasta` y `FchVtoPago`.
- **Factura manual:** no entra en la caja; el parseo del precio de catálogo con decimales y el doble click al emitir siguen igual.
- **Candado del número:** sigue siendo un `Map` en memoria (una sola instancia del proceso).
- **Reintento y fecha:** el reintento reenvía la `cbteFch` original; un pendiente de un día anterior puede caer fuera de la ventana de ARCA.
- **Hallazgo 11:** QR sin marca de agua extra, nombre fijo `factura-b.pdf`, `docNro` integer, listado sin paginar ni filtrar por ambiente.
- **Tests no escritos:** tope de consumidor final; concepto 2/3; dos procesos; choque de índice único en el cierre; impresora con factura autorizada; mail; `InvoiceController`; precio del diálogo manual; PDF leído de Postgres frente al QR de la RG 4892.
