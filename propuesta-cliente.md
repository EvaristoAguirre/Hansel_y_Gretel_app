# Propuesta funcional — Facturación electrónica (Factura B)

Documento para validar con el local antes de desarrollar. Describe qué va a poder hacer la encargada, qué ve el cliente y qué queda fuera de esta primera versión.

Complementa la investigación técnica de `api-arca-requerimientos.md`. Las decisiones de implementación están en `propuesta-tecnica.md`.

---

## 1. Qué se busca

Al cobrar, la encargada elige si esa orden se factura o no. Si elige facturar, el sistema pide a ARCA una **Factura B** y, cuando ARCA la autoriza, guarda el CAE (el código que le da validez fiscal).

Después, en Cajas de registro, puede buscar las facturas del mes, ver el detalle, reimprimirlas, bajarlas en PDF y guardar el email del cliente para enviárselas.

Cobrar y facturar no son lo mismo:

- **Cobrar** libera la mesa y registra el dinero en la caja, como hoy. Eso no depende de ARCA.
- **Facturar** es un paso aparte. Si ARCA no responde, la venta queda cobrada y la factura queda pendiente. No se imprime un ticket como si ya tuviera CAE.

## 2. Alcance de esta versión

Entra:

- Factura B, una por orden, solo si la encargada activa el switch al cobrar.
- Consumidor final (sin pedir DNI ni CUIT en el mostrador).
- Listado de facturas dentro de Cajas de registro, filtrado por mes y año.
- Ver detalle, reimprimir en la impresora térmica, descargar PDF, guardar email y enviar el PDF por correo.

No entra (queda anotado en las dudas, al final):

- Factura A, Factura C, nota de crédito ni nota de débito.
- Facturar solo una parte de la orden.
- Identificar al cliente con DNI o CUIT.
- Elegir otra alícuota de IVA por producto.
- Controlador fiscal (la impresora sigue siendo la térmica común; el valor fiscal lo da el CAE, no el aparato).
- Facturar más tarde una orden que se cobró con el switch apagado.

## 3. Quién puede hacerlo

Igual que hoy la caja y el cobro: **Admin** y **Encargado**. El mozo no cobra y no ve Cajas de registro, así que tampoco factura.

## 4. Flujo al cobrar

La pantalla de cobro no cambia de fondo. Sigue habiendo dos formas de cobrar, y las dos cierran **una sola orden**:

- Pago total (un medio o varios medios que suman el total).
- Pago dividido por productos (varios medios). Eso no parte la factura: sigue siendo una orden, una factura o ninguna.

Antes de confirmar el cobro aparece un switch:

**Emitir Factura B** — apagado por defecto.

Al lado se muestra el importe que se va a facturar, para que no haya sorpresa.

### Importe que se factura

| Entra en la factura | No entra |
|---|---|
| Consumo de la orden | Propina |
| Menos el descuento, si hubo | El medio de pago (efectivo, tarjeta, etc.) |

Ejemplo: consumo $10.000, descuento $1.000, propina $900. Se factura $9.000. La propina sigue en la caja, pero no va al comprobante.

### Si el switch está apagado

Se cobra como hoy. No se crea factura. El ticket que sale por la impresora es el de siempre (cuenta del local, sin CAE).

### Si el switch está encendido

1. Se cobra la orden y se libera la mesa. La encargada no queda trabada esperando a ARCA.
2. El sistema pide la autorización.
3. Según la respuesta:

| Qué pasó | Qué ve la encargada | Qué se imprime | Qué queda en el listado |
|---|---|---|---|
| ARCA autoriza | Aviso de cobro correcto y factura emitida, con el número | Ticket fiscal (datos del local, tipo y número, CAE, vencimiento del CAE y código QR) | Factura **Autorizada** |
| ARCA no responde (sin internet, demora) | La orden está cobrada. La factura quedó pendiente. No es un comprobante válido todavía | El ticket de cuenta de siempre, sin CAE | Factura **Pendiente**. Desde el listado se puede reintentar |
| ARCA rechaza (dato inválido) | La orden está cobrada. Se muestra el motivo que devolvió ARCA | Ticket de cuenta, sin CAE | Factura **Rechazada**, con el motivo. Se puede corregir lo que el sistema permita y reintentar |

Un rechazo no gasta número de factura. Un corte de internet tampoco debe generar dos facturas de la misma venta: antes de reintentar, el sistema consulta si ARCA ya la había autorizado.

## 5. Vista Facturas

Nueva pestaña en **Cajas de registro**, al lado de Caja diaria, Ventas y Métricas. La ven Admin y Encargado.

### Filtros

- Mes
- Año

Al entrar, muestra el mes en curso. El filtro es por la fecha del comprobante (el día en que se cobró y se pidió la factura), no por el día en que ARCA contestó.

### Listado

Cada fila muestra:

- Fecha y hora
- Número (punto de venta y número de comprobante; si todavía no está autorizada, se muestra el número reservado o “sin número”, según el estado)
- Importe facturado
- Estado: Pendiente, Autorizada, Rechazada
- Email del cliente, si se cargó

### Acciones

| Acción | Cuándo está disponible | Qué hace |
|---|---|---|
| Ver detalle | Siempre | Abre el comprobante: emisor, tipo Factura B, número, fecha, importe, CAE y vencimiento si está autorizada, ítems cobrados, descuento si hubo, y el motivo de ARCA si fue rechazada o quedó pendiente |
| Reimprimir | Solo Autorizada | Vuelve a imprimir **el mismo** comprobante en la térmica. No crea otra factura ni pide otro CAE. ARCA no limita las reimpresiones: el CAE ya está otorgado y la impresora solo saca otra copia |
| Descargar PDF | Solo Autorizada | Baja un PDF con los mismos datos obligatorios (incluido el QR). Se arma con lo guardado en la notebook: **no hace falta internet**. Sirve para enviarla después por WhatsApp, mail u otro medio si en el momento no se pudo |
| Guardar email | Siempre que la factura exista | Guarda el correo del cliente en esa factura. No envía nada todavía |
| Enviar por email | Autorizada y con email cargado | Manda el PDF adjunto. Si no hay internet o el envío falla, el email queda guardado y se puede reintentar. El PDF sigue pudiéndose descargar a mano |
| Reintentar | Pendiente o Rechazada | Vuelve a pedir la autorización. Si ARCA ya la había autorizado en el intento anterior, el sistema recupera ese CAE y no emite un duplicado |

Una factura pendiente o rechazada **no** se puede reimprimir ni descargar como comprobante fiscal. Mostrarla como factura válida antes del CAE sería incorrecto.

### Límite práctico del reintento

ARCA acepta la fecha del comprobante dentro de una ventana de pocos días respecto del día en que se procesa (cinco días si el concepto es productos). Si una factura queda pendiente y se reintenta fuera de esa ventana, ARCA la va a rechazar. Conviene resolver las pendientes el mismo día, o al día siguiente como máximo.

## 6. Qué recibe el cliente

- Si no se facturó: el ticket de cuenta actual.
- Si se facturó y ARCA autorizó: el ticket fiscal, o el PDF si se lo envían después.
- El PDF y el ticket fiscal llevan el QR. El cliente puede escanearlo para verificar el comprobante en ARCA.

El email es opcional y lo carga la encargada en el listado, no en el momento del cobro, para no alargar la fila. Si en la práctica prefieren pedirlo en el cobro, está anotado en las dudas.

## 7. Qué tiene que estar resuelto en el local antes de usarlo de verdad

Esto no es pantalla: sin esto el módulo no puede emitir comprobantes válidos.

1. Confirmar con el contador que el comercio es **Responsable Inscripto**. La Factura B es el comprobante de un responsable inscripto hacia un consumidor final. Si el local fuera monotributista, el comprobante correcto es la Factura C y esta propuesta no aplica tal cual.
2. Clave Fiscal nivel 3, certificado digital del CUIT y el servicio de factura electrónica habilitado para ese certificado.
3. Un punto de venta de facturación electrónica dado de alta.
4. Confirmar la alícuota de IVA de la carta (la propuesta asume una sola, la misma para toda la orden).
5. Datos que salen impresos: razón social, domicilio, CUIT, condición frente al IVA, ingresos brutos, inicio de actividades.
6. La notebook del local con salida a Internet (puerto 443 hacia ARCA) y la hora sincronizada. La tablet del mozo no habla con ARCA.

Mientras se desarrolla, las pruebas se hacen en el ambiente de homologación de ARCA: esos comprobantes no tienen validez fiscal y no gastan la numeración real.

## 8. Para confirmar

Estas respuestas cambian el diseño. Hasta definirlas, el desarrollo sigue las suposiciones de la sección 2 y del importe sin propina.

1. **Condición del emisor.** ¿El local es Responsable Inscripto? Si no, no corresponde Factura B.
2. **Propina.** ¿Confirmamos que la propina no se factura? Es lo habitual y es lo que propone este documento.
3. **Alícuota.** ¿Toda la carta va a la misma alícuota (por ejemplo 21 %)? Hoy los productos no tienen IVA cargado. Si hubiera ítems al 10,5 % y otros al 21 %, hay que cargar la alícuota en cada producto antes de facturar.
4. **Cliente identificado.** ¿Alcanza siempre “consumidor final”, o a partir de cierto monto hay que pedir DNI? Ese tope lo define la normativa vigente; lo tiene que confirmar el contador. Si hace falta, el cobro debería pedir el documento cuando el importe supere el tope.
5. **Olvido del switch.** ¿Hace falta, en una segunda etapa, un botón para facturar una orden ya cobrada que quedó sin factura? Se puede hacer dentro de la ventana de días que admite ARCA. En esta versión, si el switch quedó apagado, esa venta no se factura.
6. **Anulación.** Una factura con CAE no se borra. La forma de anularla es una Nota de Crédito B. ¿La necesitamos enseguida (mesa mal facturada, error de importe) o puede esperar a una etapa siguiente? Sin nota de crédito, una factura emitida por error queda firme.
7. **Email en el cobro.** ¿El correo se carga solo desde el listado, o también en la pantalla de pago, antes de que el cliente se vaya?
8. **Ticket cuando se factura.** Cuando la factura sale autorizada, el ticket fiscal reemplaza al ticket de cuenta. ¿Quieren las dos copias (cuenta + factura) o solo la factura?
