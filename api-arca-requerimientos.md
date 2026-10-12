# Integración con ARCA (ex AFIP) para facturación en un gestor de restaurantes

> Investigación técnica: web services de facturación electrónica (WSFEv1/WSAA), manejo de respuestas y errores, y equipamiento de impresión fiscal homologado. Última actualización: agosto 2026.

---

## 1. Contexto general

ARCA (Agencia de Recaudación y Control Aduanero) es el organismo que **reemplazó a la AFIP en octubre de 2024**. El cambio fue de nombre y organismo, no de reglas: se sigue usando el mismo CAE, los mismos tipos de comprobante, los mismos puntos de venta y los mismos web services SOAP (WSAA + WSFEv1).

Puntos clave a tener en cuenta para 2026:

- Desde el **1 de agosto de 2026**, el **CAE en tiempo real es obligatorio** para inscriptos en IVA (ya no se admite CAEA como modalidad por defecto).
- La **Resolución General 5.616/2024** introdujo cambios en los datos requeridos (por ejemplo, la condición de IVA del receptor pasó a ser obligatoria en varios casos — ver error 10242 en la sección de errores).
- Se requiere **Clave Fiscal nivel 3** para generar certificados digitales y dar de alta puntos de venta.

Para un gestor de restaurantes hay dos integraciones separadas pero relacionadas:

1. **Software → ARCA**: emisión del comprobante electrónico y obtención del CAE (web services WSAA + WSFEv1).
2. **Software → Hardware fiscal**: impresión del ticket/factura en el punto de venta (impresora o controlador fiscal, cuando el rubro lo exige).

---

## 2. Arquitectura de los Web Services de ARCA

Todo el intercambio se hace por **SOAP sobre HTTPS (puerto 443)**, no hay REST nativo por parte de ARCA. Se necesitan dos servicios:

| Servicio | Función |
|---|---|
| **WSAA** (Web Service de Autenticación y Autorización) | Emite el "Ticket de Acceso" (TA) que habilita a consumir cualquier otro web service de negocio (WSN), incluido WSFEv1. |
| **WSFEv1** (Web Service de Factura Electrónica v1) | Emite comprobantes A, B, C y M sin detalle de ítem, obtiene el CAE, consulta comprobantes, últimos números autorizados, parámetros (alícuotas, tipos de comprobante, puntos de venta, etc.). |

Existen variantes según el caso de uso (no aplican a un restaurante estándar, pero vale saber que existen):

- `wsmtxca`: para comprobantes A/B **con detalle de ítems** (más granular que wsfev1).
- `wsfexv1`: facturación de **exportación** (comprobantes tipo E).
- `wsbfev1`: para bienes de capital.
- `wsct`: comprobantes tipo T (alojamiento a turistas extranjeros).

Para un restaurante que emite tickets/facturas A, B y C sin necesidad de detalle de ítems ante ARCA (el detalle de ítems queda en tu propio sistema, ARCA solo pide los totales), **WSFEv1 es el servicio correcto**.

Documentación oficial:
- Manual desarrollador WSFEv1: `https://www.afip.gob.ar/fe/documentos/manual-desarrollador-ARCA-COMPG-v4-0.pdf`
- Especificación técnica WSAA: `https://www.arca.gob.ar/ws/WSAA/Especificacion_Tecnica_WSAA_1.2.2.pdf`
- Portal de documentación: `https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp`

### 2.1. Autenticación (WSAA)

Es un paso obligatorio previo a cualquier llamada a WSFEv1. El flujo es:

1. **Obtener un certificado digital X.509** asociado al CUIT del contribuyente, emitido por ARCA como Autoridad Certificante (se gestiona sin cargo desde el portal con Clave Fiscal nivel 3; para homologación/testing se usa la aplicación WSASS).
2. **Generar un TRA** (Ticket de Requerimiento de Acceso): un XML (`LoginTicketRequest.xml`) que indica el `service` (para facturación: `wsfe`), una marca de tiempo de generación (`generationTime`) y de expiración (`expirationTime`), y un identificador único (`uniqueId`).
3. **Firmar el TRA** con la clave privada del certificado generando una estructura **CMS** (PKCS#7/S-MIME) que incluye el TRA, la firma digital y el certificado X.509.
4. **Invocar el método `loginCms`** del WSAA enviando el CMS en el parámetro `in0`.
5. ARCA responde con un **TA (Ticket de Acceso)**, un XML que contiene:
   - `<token>` y `<sign>`: credenciales que se envían en cada llamada a WSFEv1 (van en el header SOAP).
   - `<expirationTime>`: el TA es válido por **12 horas**; hay que cachearlo y reutilizarlo dentro de ese lapso (si se pide un TA nuevo antes de que expire el vigente, WSAA devuelve error).

Requisitos técnicos importantes:
- Comunicación exclusivamente por **HTTPS/TLS**.
- El reloj del servidor cliente debe estar sincronizado (se recomienda NTP contra `time.afip.gov.ar`), porque el TRA se rechaza si las fechas están desfasadas.
- No se necesita un certificado por cada web service: un mismo certificado sirve para todos los WSN una vez habilitado (se debe habilitar el servicio `wsfe` para ese certificado desde "Administrador de Relaciones" con la Clave Fiscal).

Errores típicos del WSAA (ver sección 4).

### 2.2. Métodos del WSFEv1

Un contribuyente típico solo necesita implementar los métodos correspondientes al régimen de CAE en tiempo real (no CAEA). Los métodos principales son:

| Método | Uso |
|---|---|
| `FEDummy` | Verifica el estado de disponibilidad del servicio (no requiere autenticación de negocio, solo confirma que los servidores de ARCA están operativos). Ideal para un *health check* antes de facturar. |
| `FECompUltimoAutorizado` | Devuelve el **último número de comprobante autorizado** para un punto de venta (`PtoVta`) y tipo de comprobante (`CbteTipo`). Se usa siempre antes de facturar, para saber qué número corresponde emitir a continuación. |
| `FECAESolicitar` | **Método principal**: envía los datos del comprobante (o lote) y solicita el CAE. Devuelve aprobación, rechazo o rechazo parcial. |
| `FECompConsultar` | Consulta un comprobante ya emitido (por `PtoVta`, `CbteTipo`, `CbteNro`) y recupera su CAE, fecha de vencimiento y demás datos. Es la forma de recuperar información si hubo un corte de conexión después de enviar `FECAESolicitar` pero antes de recibir la respuesta. |
| `FECompTotXRequest` | Devuelve la cantidad máxima de comprobantes que se pueden incluir en un mismo lote de `FECAESolicitar`. |
| `FEParamGetTiposCbte` | Lista los tipos de comprobante válidos (Factura A=1, Factura B=6, Factura C=11, Nota de Crédito/Débito, etc.). |
| `FEParamGetTiposIva` | Lista las alícuotas de IVA válidas y sus códigos. |
| `FEParamGetPtosVenta` | Lista los puntos de venta habilitados para facturación electrónica. |
| `FEParamGetCotizacion` | Cotización de moneda (para operaciones en moneda distinta a pesos). |
| `FEParamGetActividades` | Actividades económicas vigentes del emisor. |

#### Parámetros clave de `FECAESolicitar`

Estructura general del request (`FeCAEReq`):

- **`FeCabReq`** (cabecera del lote):
  - `CantReg`: cantidad de comprobantes en el lote.
  - `PtoVta`: punto de venta.
  - `CbteTipo`: tipo de comprobante (numérico).
- **`FeDetReq` → `FECAEDetRequest`** (uno por comprobante):
  - `Concepto`: 1=Productos, 2=Servicios, 3=Productos y Servicios.
  - `DocTipo` / `DocNro`: tipo y número de documento del receptor (80=CUIT, 96=DNI, 99=Consumidor Final, etc.).
  - `CbteDesde` / `CbteHasta`: número de comprobante (normalmente igual para ambos si es uno solo).
  - `CbteFch`: fecha del comprobante (`AAAAMMDD`).
  - `ImpTotal`, `ImpTotConc`, `ImpNeto`, `ImpOpEx`, `ImpTrib`, `ImpIVA`: importes (total, no gravado, neto gravado, exento, tributos, IVA).
  - `MonId` / `MonCotiz`: moneda y cotización ("PES" y 1 para pesos).
  - `CondicionIVAReceptorId`: **condición de IVA del receptor** (obligatorio desde RG 5.616/2024 — omitirlo genera el error 10242).
  - Arrays opcionales: `Iva` (detalle de alícuotas), `Tributos`, `Opcionales` (para CAE en QR, etc.), `Compradores`.

#### Respuesta de `FECAESolicitar`

```
FECAESolicitarResult
├── FeCabResp
│   ├── Cuit
│   ├── PtoVta
│   ├── CbteTipo
│   ├── FchProceso
│   ├── CantReg
│   ├── Resultado      → "A" (Aprobado), "R" (Rechazado), "P" (Parcial)
│   └── Reproceso       → "S"/"N" (si la respuesta es de un reintento ya procesado)
├── FeDetResp
│   └── FeDetResp[]      (uno por comprobante)
│       ├── Concepto, DocTipo, DocNro
│       ├── CbteDesde, CbteHasta, CbteFch
│       ├── Resultado    → "A"/"R"
│       ├── CAE          → código de autorización (si Resultado = "A")
│       ├── CAEFchVto    → fecha de vencimiento del CAE
│       └── Observaciones[] → motivos de rechazo/advertencia si los hay
├── Errors[]   → errores generales de la solicitud completa
└── Events[]   → eventos informativos
```

**Manejo de éxito**: cuando `Resultado = "A"`, se guarda el `CAE` y `CAEFchVto`, y con eso el comprobante ya es válido fiscalmente. Se recomienda:
- Persistir el CAE y la fecha de vencimiento en la base de datos del pedido/comprobante.
- Generar el PDF/ticket con el CAE y el **código QR** (obligatorio en todos los comprobantes desde la RG 4.892; el QR contiene un JSON codificado en base64 con los datos del comprobante).
- Enviar/almacenar el comprobante para el cliente.

**Manejo de rechazo o rechazo parcial**:
- `Resultado = "R"`: el comprobante no obtuvo CAE. Revisar `Observaciones` (motivo puntual) y `Errors` (errores generales). Corregir y reintentar — **no se cobra ni consume cuota por un rechazo**, se puede reintentar sin costo.
- `Resultado = "P"` (rechazo parcial, solo en lotes): algunos comprobantes del lote se aprueban y otros no. Como ARCA exige correlatividad numérica y de fecha, un rechazo en medio del lote hace que los comprobantes siguientes también salgan como "no procesados". Hay que corregir el comprobante que causó el rechazo y reenviar un nuevo lote a partir de ahí.

**Manejo de fallos de conexión** (no se recibe respuesta, timeout, etc.):
1. **Nunca reintentar `FECAESolicitar` a ciegas** con el mismo número: primero llamar a `FECompConsultar` para ese `PtoVta`/`CbteTipo`/`CbteNro`.
   - Si devuelve datos (incluido el CAE): el comprobante **sí se autorizó** en ARCA aunque no llegó la respuesta al cliente. Usar esos datos.
   - Si devuelve "no existe": el error de conexión ocurrió antes de que ARCA procesara la solicitud → recién ahí se puede reintentar `FECAESolicitar` con los mismos datos.
2. Alternativamente, `FECompUltimoAutorizado` indica el último número procesado (pero no el CAE; para el CAE siempre hace falta `FECompConsultar`).

### 2.3. Numeración y correlatividad

- Antes de cada emisión: consultar `FECompUltimoAutorizado` y usar `último + 1`.
- ARCA exige que la fecha del comprobante (`CbteFch`) esté dentro de una ventana: **±5 días** para venta de productos, **±10 días** para servicios, respecto a la fecha de proceso.
- No se pueden saltear números ni retroceder fechas dentro de un mismo punto de venta/tipo de comprobante.

### 2.4. Ambientes

| Ambiente | URL WSAA | Uso |
|---|---|---|
| **Homologación** (testing) | `https://wsaahomo.afip.gov.ar/ws/services/LoginCms` | Pruebas, sin validez fiscal, no consume cupos reales. Requiere certificado de testing generado por WSASS. |
| **Producción** | `https://wsaa.afip.gov.ar/ws/services/LoginCms` | Comprobantes reales con validez legal. Requiere certificado de producción. |

Las URLs de WSFEv1 correspondientes a cada ambiente están publicadas en el manual del desarrollador y también cambian entre homologación y producción; conviene parametrizarlas por variable de entorno para poder alternar sin tocar código.

---

## 3. Alternativas a implementar el SOAP crudo

Implementar WSAA + firma CMS + SOAP desde cero es la parte más costosa del proyecto (maneja certificados, XML, criptografía). Opciones habituales:

1. **Librerías open source** que envuelven WSAA/WSFEv1 (hay implementaciones en PHP, Node.js, Python, .NET, Java). Manejan la generación del TRA, la firma CMS con OpenSSL y el cliente SOAP, exponiendo los métodos de WSFEv1 (`FECAESolicitar`, etc.) de forma directa.
2. **Servicios REST intermediarios (SaaS)**: exponen una API REST simple sobre WSFEv1/WSFEX, resolviendo internamente la autenticación WSAA, el cacheo del TA y a veces la numeración automática e idempotencia. Reducen tiempo de desarrollo a cambio de una dependencia de terceros y, generalmente, un costo por comprobante o por plan. Antes de adoptar uno conviene evaluar: seguridad en el manejo del certificado/clave privada, SLA, soporte de comprobantes A/B/C, y si guardan copia de tus datos fiscales.

Cualquiera de las dos vías termina consumiendo los mismos conceptos descritos arriba (CAE, `PtoVta`, `CbteTipo`, condición de IVA del receptor, etc.), así que el modelo de datos interno del gestor de restaurantes debería diseñarse independientemente del proveedor elegido.

---

## 4. Errores más comunes y cómo tratarlos

### 4.1. Errores de autenticación (WSAA)

| Situación | Causa | Solución |
|---|---|---|
| Certificado vencido | El certificado con el que se firmó el TRA venció | Renovar el certificado digital desde el portal de ARCA |
| Certificado no confiable | El certificado no fue emitido por la Autoridad Certificante de ARCA | Verificar que se generó desde WSASS (homologación) o el trámite oficial (producción) |
| TRA rechazado por reloj desfasado | Fechas de `generationTime`/`expirationTime` inválidas respecto al reloj de ARCA | Sincronizar el reloj del servidor por NTP |
| Firma CMS inválida | Error al firmar o verificar el CMS | Revisar el proceso de firma (OpenSSL/librería), que la clave privada corresponda al certificado |
| Servicio no habilitado | El contribuyente no tiene el WSN (`wsfe`) habilitado para ese certificado | Habilitar el servicio desde "Administrador de Relaciones" con Clave Fiscal |
| TA duplicado | Se pide un nuevo TA para el mismo servicio estando aún vigente el anterior | Cachear y reutilizar el TA hasta que expire (12 hs) |

### 4.2. Errores de negocio (WSFEv1) — los más frecuentes

| Código | Mensaje / causa | Solución |
|---|---|---|
| **10016** | El número o fecha del comprobante no se corresponde con el próximo a autorizar | Consultar `FECompUltimoAutorizado` antes de emitir y usar el siguiente número correlativo; verificar que `CbteFch` no sea anterior a la última autorizada ni esté fuera de la ventana permitida (±5/±10 días) |
| **10242** | Condición de IVA del receptor faltante o inválida (obligatorio desde RG 5.616/2024) | Enviar siempre `CondicionIVAReceptorId` con un valor válido según `FEParamGetCondicionIvaReceptor` |
| **600 / 601** | Problemas con el ticket de acceso (token/firma no coinciden, usuario no autorizado) | Verificar que el TA usado corresponde al CUIT y servicio correctos, y que no expiró |
| **602** | Los datos enviados no coinciden con los registros de ARCA / no existen datos | Revisar CUIT, punto de venta o tipo de comprobante consultado |
| Genérico (Errors[]) | Error interno de aplicación o de base de datos de ARCA | Reintentar más tarde; si persiste, contactar soporte de ARCA |

**Patrón recomendado de manejo de errores en el código:**

```
intentar FEDummy → si falla, marcar servicio caído y avisar al usuario (no bloquear la venta, guardar el pedido como pendiente de facturar)

antes de facturar:
  FECompUltimoAutorizado(PtoVta, CbteTipo) → siguienteNro

armar comprobante con siguienteNro y CondicionIVAReceptorId

llamar FECAESolicitar
  si Resultado == "A" → guardar CAE + CAEFchVto, imprimir/enviar comprobante
  si Resultado == "R" → leer Observaciones[], mostrar motivo al usuario, permitir corregir y reintentar (sin costo)
  si Resultado == "P" (lote) → procesar cada FeDetResp individualmente

si hay timeout / sin respuesta:
  llamar FECompConsultar(PtoVta, CbteTipo, siguienteNro)
    si existe con CAE → usar esos datos (ya se había autorizado)
    si no existe → recién ahí reintentar FECAESolicitar
```

Para un restaurante, esta lógica es crítica: nunca se debe permitir que una caída momentánea de red genere una factura duplicada o un comprobante "fantasma" sin CAE.

---

## 5. Equipamiento para impresión de tickets fiscales

### 5.1. ¿Cuándo hace falta un controlador fiscal (y cuándo no)?

Un **restaurante que emite facturas electrónicas por software (WSFEv1) puede imprimir el ticket en una impresora térmica común** (no fiscal), siempre que el comprobante ya tenga CAE válido — la impresora es solo el soporte físico, el valor fiscal lo da el CAE de ARCA, no el hardware.

El **controlador fiscal** (hardware homologado que registra las ventas y emite el comprobante él mismo) sigue siendo la alternativa clásica, y en la práctica:

- **Gastronomía con alto volumen de tickets a consumidor final** (bares, restaurantes, casas de comida, fast food) suele estar comprendida en los regímenes que privilegian su uso, sobre todo por velocidad operativa en horas pico.
- Para comercios chicos o de bajo volumen, hoy alcanza con facturación electrónica por software + impresora térmica común, sin necesidad de controlador fiscal.
- La normativa exacta que obliga al uso de controlador fiscal según actividad y volumen está detallada por anexos de resoluciones generales de ARCA (ex Resolución General AFIP 3.561 y modificatorias); conviene confirmar con un contador la situación puntual del comercio, ya que depende de la actividad declarada y el volumen de facturación.

**Recomendación práctica para el gestor de restaurantes**: diseñar el módulo de impresión para soportar ambos escenarios —
1. **Impresión directa de la factura electrónica con CAE** (impresora térmica común, ESC/POS estándar), y
2. **Integración con controlador fiscal** (driver específico por marca), como opción configurable, para los locales que sí estén alcanzados por la obligación o prefieran esa modalidad por volumen.

### 5.2. Controladores fiscales homologados — marcas y modelos vigentes (2026)

Los controladores fiscales vigentes son los de **Nueva Generación (NG)**: incluyen impresión de código QR, conectividad de red y soporte del Régimen de Transparencia Fiscal. Los modelos de "Vieja Tecnología" (VT) están discontinuados.

Marcas homologadas por ARCA con presencia activa en el mercado argentino:

| Marca | Modelos de referencia | Notas |
|---|---|---|
| **Epson** | TM-T900FA (modelo homologado "01.02 JANO") | Impresora fiscal térmica 80mm, alta velocidad, muy usada en gastronomía |
| **Hasar** | SMH-PT250F, P-HAS-5100-FAR | Impresora fiscal térmica 80mm, orientada a facturación continua/alto volumen |
| **Sam4s** | ELLIX 40F, NR-330F, Zeta-A50 | Ofrece tanto impresoras fiscales como registradoras fiscales; la Zeta-A50 corre Android y factura directo a ARCA por Wi-Fi/Ethernet sin pendrive |
| **Moretti** | (línea de controladores NG) | Presencia en el mercado, actualización de firmware al nuevo régimen realizada |
| **Kretz** | NUM 100 TEA | Registradora fiscal |
| **Crams** | (línea propia) | Distribuido junto con software de gestión propio |

Estas marcas requieren un **firmware específico homologado por ARCA** (cada actualización de normativa —como la Ley de Transparencia Fiscal— obliga a las marcas a emitir un nuevo firmware que debe volver a homologarse). El listado oficial y actualizado de proveedores, marcas y modelos homologados se publica en:

`https://serviciosweb.afip.gob.ar/facturacion/controladores-de-nueva-tecnologia/default.asp`

### 5.3. Requerimientos técnicos para integrar un controlador fiscal

A diferencia de WSFEv1 (SOAP sobre HTTPS), la comunicación con un controlador fiscal es **local**, típicamente:

- **Conexión física**: USB, Serial (RS-232) o Ethernet/Wi-Fi (modelos NG más nuevos).
- **Protocolo del fabricante**: cada marca (Epson, Hasar, Sam4s, etc.) publica su propio protocolo de comandos (no hay un estándar único entre fabricantes, a diferencia de ESC/POS para impresoras térmicas comunes). Generalmente se integra vía:
  - Un **driver/DLL o librería nativa** provista por el fabricante (Windows, a veces Linux), o
  - Un **servicio/OCX de terceros** que unifica el protocolo de varias marcas bajo una sola interfaz (útil si el gestor de restaurantes quiere soportar múltiples marcas sin reimplementar cada protocolo).
- **Alta fiscal del equipo**: el controlador debe darse de alta ante ARCA (vinculado al CUIT y domicilio del comercio) antes de poder emitir comprobantes válidos; esto lo gestiona habitualmente el proveedor/instalador al momento de la venta e instalación.
- **Rollos térmicos**: 80mm es el ancho estándar en la mayoría de los modelos NG mencionados.
- **Servicio técnico homologado**: las actualizaciones de firmware (obligatorias cuando cambia la normativa) deben realizarlas técnicos habilitados por ARCA, no es algo que se resuelva por software desde el gestor.

### 5.4. Impresión de tickets sin controlador fiscal (factura electrónica + impresora común)

Si el restaurante opta por (o le alcanza con) facturación electrónica por software:

- Cualquier **impresora térmica ESC/POS estándar** (Epson TM-T20/TM-T88 en modo no fiscal, Star, Bixolon, etc.) sirve para imprimir el comprobante ya autorizado (con CAE y QR).
- El diseño del ticket debe incluir obligatoriamente: datos del emisor, tipo y número de comprobante, CAE, fecha de vencimiento del CAE, y el **código QR** con los datos codificados según el esquema que publica ARCA (JSON en base64 con: `ver`, `fecha`, `cuit`, `ptoVta`, `tipoCmp`, `nroCmp`, `importe`, `moneda`, `ctz`, `tipoDocRec`, `nroDocRec`, `tipoCodAut` (siempre "E" para CAE), `codAut`).
- Es la opción de menor costo de hardware y más simple de integrar (no requiere drivers propietarios ni alta fiscal de equipo), a costa de perder la velocidad/robustez operativa que da un controlador fiscal dedicado en un local con mucho movimiento.

---

## 6. Resumen de recomendaciones para el proyecto

1. **Backend de facturación**: implementar (o integrar una librería/servicio ya probado para) WSAA + WSFEv1, con caché del TA por 12 hs, consulta de `FECompUltimoAutorizado` previa a cada emisión, y el patrón de reintento seguro descrito en la sección 4.2 (nunca reintentar a ciegas: siempre `FECompConsultar` primero ante un timeout).
2. **Modelo de datos**: guardar por cada comprobante — `PtoVta`, `CbteTipo`, número, `CondicionIVAReceptorId`, CAE, `CAEFchVto`, estado (`pendiente`/`autorizado`/`rechazado`), y el detalle de observaciones/errores devueltos por ARCA para trazabilidad y soporte.
3. **Ambientes**: parametrizar homologación/producción (URLs y certificados) para poder testear sin arriesgar numeración real.
4. **Impresión**: desacoplar la lógica de "obtener CAE" (siempre vía ARCA) de la de "imprimir" (impresora común con QR, o controlador fiscal con protocolo propietario), soportando ambos modos como configuración por local/comercio.
5. **Validación previa**: antes de habilitar el módulo en un comercio, confirmar con un contador si esa actividad/volumen está alcanzado por la obligación de controlador fiscal, dado que depende de anexos normativos específicos por rubro.
6. **Consultar siempre la fuente oficial** antes de pasar a producción: `https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp` y el listado de controladores homologados en `https://serviciosweb.afip.gob.ar/facturacion/controladores-de-nueva-tecnologia/default.asp`, ya que tanto la normativa como los manuales de desarrollador se actualizan con relativa frecuencia.
