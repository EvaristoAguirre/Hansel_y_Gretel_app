# Plan de implementación — Factura B

Orden de construcción de lo definido en `propuesta-tecnica.md`. Cada paso se puede probar sin el siguiente.

Dos variables gobiernan el proceso desde el primer paso:

- `AFIP_SIMULATE`: flag. En `true` no hay red ni certificado; el CAE es ficticio.
- `AFIP_ENV`: `homologacion` o `produccion`. Elige las URLs de ARCA cuando la flag está apagada.

Con la flag encendida se puede construir y probar el flujo entero (cobro, listado, PDF, mail, generador) antes de tener el certificado. El cliente SOAP real entra en el paso 8 y no cambia lo que ya esté andando: `InvoiceService` habla con `ArcaClient` y no sabe cuál de las dos implementaciones está atrás.

Default de desarrollo en `backend/.env.example`:

```
AFIP_SIMULATE=true
AFIP_SIMULATE_RESULT=authorized
AFIP_ENV=homologacion
```

---

## Paso 1 — Configuración y arranque

**Objetivo:** el proceso sabe en qué modo está y se niega a arrancar en una combinación peligrosa.

- Módulo `backend/src/Invoice/` con `AfipConfig`.
- Mapa de URLs por `AFIP_ENV` (homologación y producción), como en la sección 3 de la propuesta técnica.
- Validación al boot, antes de escuchar HTTP:
  - `AFIP_SIMULATE=true` y `AFIP_ENV=produccion` → el proceso no arranca.
  - `AFIP_SIMULATE=false` sin `AFIP_ENV` válido, sin CUIT, sin punto de venta o sin cert/clave → el proceso no arranca.
  - `AFIP_SIMULATE=true` → no lee el certificado.
- Documentar las variables en `backend/.env.example`, sin secretos.
- Log de arranque con el modo (`simulado` / `homologacion` / `produccion`). Una línea, sin datos del certificado.

**Listo cuando:** la app levanta con la flag encendida y sin archivos de certificado, y un arranque con `AFIP_SIMULATE=true` más `AFIP_ENV=produccion` termina con un mensaje claro.

## Paso 2 — Contrato de ARCA y simulador

**Objetivo:** el resto del módulo puede pedir un CAE sin red.

`ArcaClient` expone: último autorizado, solicitar CAE, consultar comprobante, dummy y lectura de parámetros (tipos de IVA, condición IVA receptor, puntos de venta).

`ArcaSimulator` implementa ese contrato:

- Numeración local por `afipEnv + ptoVta + cbteTipo`.
- `AFIP_SIMULATE_RESULT=authorized` devuelve CAE de 14 dígitos y vencimiento a 10 días.
- `rejected` devuelve un motivo fijo.
- `timeout` no devuelve respuesta; la consulta de ese número dice que no existe.

Tests del simulador, sin red. El cliente SOAP real no entra todavía.

**Listo cuando:** los tres resultados del simulador están cubiertos por tests y ningún test abre un socket.

## Paso 3 — Persistencia

**Objetivo:** hay dónde guardar la factura y la alícuota del producto.

Migración TypeORM:

- Tabla `invoices` como en la sección 4.1. `orderId` nullable. Único parcial sobre `orderId`. Único `(afipEnv, ptoVta, cbteTipo, cbteNro)`.
- Tabla `afip_tokens`.
- Columna `products.alicQuota` numeric nullable.

Importes en `numeric`. La migración sube y baja.

**Listo cuando:** `migration:run` aplica las tablas en una base local vacía de estas columnas y `migration:revert` las saca.

## Paso 4 — Cálculo de importes

**Objetivo:** una función pura arma el comprobante, con una o varias alícuotas.

`InvoiceCalculator`:

- Suma consumo, resta descuento, deja la propina afuera.
- Agrupa por `alicQuota`. Reparte el descuento a dos decimales y ajusta el último grupo.
- Arma el array `iva` y ajusta el centavo para que neto + IVA = total.
- Importe cero o negativo: error, sin fila.

Tests: una alícuota al 21 %, dos alícuotas (21 % y 10,5 %), descuento que no cae justo, propina presente en la orden e ignorada, descuento del 100 %, producto sin alícuota usando el default.

**Listo cuando:** esos casos pasan y no hay llamada a base ni a red en este archivo.

## Paso 5 — Emisión al cobrar

**Objetivo:** el switch crea la factura después del cobro y un fallo de ARCA no deshace la venta.

- `CloseOrderDto`: `invoice?: boolean` y `customerEmail?: string`.
- En `OrderService.closeOrder`: validar importe si `invoice` es true; commitear el cobro actual; después crear la fila y llamar a `InvoiceService`.
- `InvoiceService.solicitar` usa el cliente del paso 2. Mutex por `afipEnv + ptoVta + cbteTipo`.
- Foto de ítems con el mismo criterio que `buildProductLines`. Alícuota de la línea = `product.alicQuota` o el default.
- La respuesta del cobro incluye el bloque `invoice`.
- Email del body guardado en `customerEmail` solo si `invoice` es true.

Tests de servicio, con `ArcaClient` mockeado (además de los del simulador):

- Autorizado.
- Rechazado, con el motivo persistido.
- Timeout y consulta que encuentra CAE → `authorized`, sin un segundo solicitar.
- Timeout y consulta que no encuentra → `pending`, un solo `cbteNro`.
- Dos solicitudes concurrentes no repiten número.
- Segunda factura para la misma orden no se crea.
- Importe cero no cierra la orden.

**Listo cuando:** esos tests pasan con `AFIP_SIMULATE=true`. La mesa queda libre en todos los casos en que el cobro commiteó.

## Paso 6 — Ticket fiscal en el paso 4

**Objetivo:** al cobrar se imprime solo la factura autorizada. El ticket de cuenta del paso 3 no se toca.

- Método nuevo en `PrinterService`, aparte de `printTicketOrder`.
- Se llama desde `closeOrder` únicamente si `status === authorized`.
- Pendiente, rechazada o switch apagado: ninguna impresión en el cierre.
- Contenido de la sección 8.4 de la propuesta técnica, incluida la leyenda cuando `afipEnv` es `simulado`.
- Misma regla que el ticket actual: en `NODE_ENV !== production` se loguea y no se envía a la térmica.
- Un fallo de impresora no cambia el estado de la factura.

`markOrderAsPendingPayment` sigue imprimiendo el ticket de cuenta. No modificar ese camino salvo que un test existente se rompa por un tipo compartido.

**Listo cuando:** un test del cierre autorizado invoca el método fiscal y no `printTicketOrder`, y un cierre pendiente no invoca ninguno de los dos.

## Paso 7 — Pantalla de cobro

**Objetivo:** la encargada enciende el switch, ve el importe y puede dejar el email.

En `frontend/components/Order/Pay.tsx` y `frontend/api/order.ts`:

- Switch “Emitir Factura B”, apagado por defecto, en pago total y en pago parcial.
- Importe a facturar al lado (consumo − descuento, sin propina).
- Ícono que abre un input de email. Se envía solo con el switch encendido.
- `Swal` distinto para autorizada, pendiente y rechazada. En los dos últimos, el texto dice que la orden quedó cobrada.

Probar en el navegador con el backend en simulación, cambiando `AFIP_SIMULATE_RESULT` para ver los tres avisos. Recorrer también un cobro con el switch apagado: la orden se cierra, no aparece factura y el paso 4 no imprime.

**Listo cuando:** los tres resultados se ven en la pantalla de pago y el email cargado queda en la fila.

## Paso 8 — Cliente ARCA real

**Objetivo:** la misma interfaz habla con homologación. Este paso es el primero que necesita certificado, CUIT y punto de venta de prueba.

- `ArcaWsfeClient`: TRA, firma CMS, `loginCms`, caché en `afip_tokens`, `FECAESolicitar`, `FECompConsultar`, `FECompUltimoAutorizado`, `FEDummy`, `FEParamGetTiposIva`, `FEParamGetCondicionIvaReceptor`, `FEParamGetPtosVenta`.
- `AfipConfig` elige simulador o este cliente según `AFIP_SIMULATE`.
- Endpoint de Admin que ejecuta dummy y los tres parámetros y muestra el JSON.
- Anotar en el entorno el id de condición IVA receptor del consumidor final.
- Verificar el mapa porcentaje → id contra `FEParamGetTiposIva` y corregir el archivo único si algún id no coincide.
- Un TRA rechazado por hora desfasada se loguea con ese motivo.

**Listo cuando:** con `AFIP_SIMULATE=false` y `AFIP_ENV=homologacion`, dos arranques seguidos reutilizan el mismo TA y `FEDummy` responde OK. Una orden de prueba con el switch encendido queda `authorized` con un CAE de homologación.

## Paso 9 — Listado y reintento

**Objetivo:** las pendientes se resuelven desde la pantalla, sin tocar la base.

- `GET /invoices` y `GET /invoices/:id`.
- Tab “Facturas” en `frontend/components/DailyCash/PanelDailyCash.tsx`. Filtros mes y año, default mes actual. DataGrid en la línea de `DailySalesView`.
- Columnas: fecha, comprobante, origen, importe, estado, email, marca de simulado.
- Modal de detalle con la foto, el CAE, el desglose y las observaciones.
- `POST /invoices/:id/retry` cableado al servicio del paso 5. Confirmación antes de disparar.
- Reintento de una fila `simulado` con la flag apagada: 409, con el motivo en pantalla.
- Fuera de la ventana de fechas: se muestra el texto de ARCA y no hay reintento automático.

**Listo cuando:** una factura `pending` pasa a `authorized` desde la pestaña (en simulación o en homologación) y una `rejected` muestra el motivo.

## Paso 10 — PDF y reimpresión

**Objetivo:** el comprobante autorizado se vuelve a sacar sin internet.

- `GET /invoices/:id/pdf` con pdfkit y el QR de la RG 4892. Librería de QR a agregar; pdfkit ya está.
- `POST /invoices/:id/print` reutiliza el ticket del paso 6.
- Ambos leen snapshot + columnas fiscales. Probar después de un archivado: la orden ya no está en `orders` y el PDF sale igual.
- Acciones de la grilla habilitadas solo en `authorized`, deshabilitadas con tooltip en los otros estados.
- Leyenda de simulación en el PDF y en la reimpresión cuando corresponda.
- La descarga usa el token en el header.

**Listo cuando:** el PDF se descarga con la red cortada, el QR tiene el formato esperado y la reimpresión no llama a `ArcaClient`.

## Paso 11 — Email

**Objetivo:** el correo guardado en el cobro o en el listado se puede enviar cuando hay red.

- `PATCH /invoices/:id/email` y `POST /invoices/:id/send-email`.
- `InvoiceMailService` con `SMTP_*`. Adjunto = el PDF del paso 10.
- En la grilla: editar email y botón Enviar, este último solo si está autorizada y hay email.
- Fallo de SMTP: 502, el email y el CAE siguen guardados.

**Listo cuando:** un envío de prueba llega con el PDF, y un SMTP mal configurado deja la factura autorizada y el email intacto.

## Paso 12 — Alícuota en el producto

**Objetivo:** la carta puede dejar de estar toda al 21 % sin otro cambio en la emisión.

- Selector en `frontend/components/Products/TabProducts/Modal/ProductCreationModal.tsx`. Vacío = default del entorno.
- Alta y edición persisten `alicQuota`.
- Una orden con un producto al 21 % y otro al 10,5 % produce dos ítems en `iva`.

La columna ya existe desde el paso 3. Hasta este paso, todo producto sin valor factura al default.

**Listo cuando:** el caso de dos alícuotas se ve en el detalle de la factura y en el PDF.

## Paso 13 — Generador manual

**Objetivo:** emitir una Factura B sin mesa.

- `POST /invoices` con líneas (concepto, cantidad, precio, alícuota), descuento en pesos y email opcional.
- Misma `InvoiceService.solicitar`, mismo mutex de numeración.
- Vista “Nueva factura” dentro de la tab Facturas. Se puede precargar una línea desde el catálogo y editarla antes de emitir.
- No crea orden, no cambia la mesa y no escribe en la caja diaria.
- El resultado (autorizada, pendiente, rechazada) se muestra igual que en el cobro, y la fila entra al listado con origen Manual.

**Listo cuando:** una factura manual queda autorizada en simulación, aparece en el mes en curso y la caja del día no tiene un movimiento nuevo por esa emisión.

## Paso 14 — Producción

**Objetivo:** el primer comprobante real, controlado.

- Certificado de producción, punto de venta real, `AFIP_SIMULATE=false`, `AFIP_ENV=produccion`.
- Checklist: NTP, salida 443, backup de la clave fuera del repo, la clave no está en git, el arranque loguea `produccion`.
- Una factura de monto mínimo acordado con el contador. Consultarla, bajar el PDF y confrontar el ticket con ese CAE.
- Dejar `AFIP_SIMULATE=true` como default del `.env.example` de desarrollo.

**Listo cuando:** el contador da por válido ese comprobante (número, CAE, QR, importes, alícuota).

---

## Qué queda fuera de estos pasos

- Nota de crédito y anulación de un CAE.
- Facturar una orden que se cobró con el switch apagado.
- DNI, CUIT, Factura A, Factura C, controlador fiscal.
- Exento y no gravado.
- Registrar el dinero del generador manual en la caja.

## Orden práctico si el certificado tarda

Los pasos 1 a 7 y 9 a 13 se desarrollan y se demuestran con `AFIP_SIMULATE=true`. El paso 8 se enchufa cuando haya certificado de homologación, sin rehacer pantallas ni tablas. El paso 14 es el único que usa `AFIP_ENV=produccion`, y solo con la flag apagada.

---

## Avance

### Paso 1 — hecho

Configuración de arranque en `backend/src/Invoice/`. La validación corre antes de crear la aplicación HTTP.

- `AFIP_SIMULATE` ausente se toma como `true`, para que un despliegue que todavía no define la variable no llame a ARCA. Quedó anotado en la tabla de `propuesta-tecnica.md`.
- Verificación: 10 tests de `resolveAfipConfig`. `nest start` con `AFIP_SIMULATE=true` y sin certificado loguea `Facturación electrónica: modo simulado` y escucha en el puerto. `AFIP_SIMULATE=true` con `AFIP_ENV=produccion` termina con código 1 y el mensaje de combinación inválida, antes de abrir el puerto.
- Nota: invocar `src/main.ts` con ts-node no es el arranque del proyecto. Las entidades se cargan desde `dist`, y en ese camino el seeder falla con `EntityMetadataNotFoundError` de `UnitOfMeasure`. Con `nest start` el proceso levanta. No se modificó el seeder.

### Paso 2 — hecho

Contrato `ArcaClient` y `ArcaSimulator`. La numeración vive en memoria del proceso, por punto de venta y tipo. Todavía no hay tabla.

- Los tres resultados (`authorized`, `rejected`, `timeout`) están cubiertos. Un rechazo o un timeout no dejan comprobante consultable. Repetir un número ya autorizado devuelve el mismo CAE con `reproceso: true`.
- El test de dummy espía `net.Socket.prototype.connect` y no se llama.
- `InvoiceModule` inyecta el simulador cuando la flag está encendida. Con `AFIP_SIMULATE=false` el proceso sigue arrancando: la primera llamada al cliente responde que el SOAP entra en el paso 8.
- Los ids de alícuota del simulador y el id 0 de condición IVA receptor son de desarrollo. Se contrastan con ARCA en el paso 8. No hay que copiarlos al entorno como si fueran definitivos.

### Paso 3 — escrito, sin ejecutar

Migración `1783400000000-CreateInvoicesAndProductAlicuota`: tablas `invoices` y `afip_tokens`, columna `products.alicQuota`, índices únicos parciales. Entidades `Invoice` y `AfipToken`. Typecheck y tests del módulo en verde.

No se corrió `migration:run` ni `migration:revert`. Antes de reiniciar el backend hay que aplicarla a mano. Si el proceso nuevo arranca sin esa columna, el SELECT de productos falla.
