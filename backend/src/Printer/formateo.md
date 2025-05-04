### **Tipografías Disponibles**

Los comandos ESC/POS suelen soportar **3 fuentes principales**:

| Comando        | Fuente                             | Características                   | Ejemplo Visual (Simulado) |
| -------------- | ---------------------------------- | --------------------------------- | ------------------------- |
| `\x1B\x4D\x00` | **Font A** (predeterminada)        | 12x24 puntos, más estrecha y alta | `Texto con Font A`        |
| `\x1B\x4D\x01` | **Font B**                         | 9x17 puntos, más ancha y compacta | `Texto con Font B`        |
| `\x1B\x4D\x02` | **Font C** (no siempre disponible) | Alta densidad (ej: 24x48)         | `Texto con Font C`        |

---

### **Control de Tamaño**

Además de "normal" (`\x1D\x21\x00`) y "doble" (`\x1D\x21\x11`), puedes **escalar el texto libremente** usando el comando `GS ! n`:

```typescript
// Comando: \x1D\x21\x[n]
// Donde "n" es un byte que controla:
// - Bits 0-3: Anchura (1-8x)
// - Bits 4-7: Altura (1-8x)

// Ejemplo: Texto 3x de ancho y 2x de alto
'\x1D\x21\x12'; // (1 << 4) | 2 = 0x12
```

#### **Tabla de Escalado Práctico**:

| Escala              | Valor Hex | Código         | Ejemplo Visual (Simulado) |
| ------------------- | --------- | -------------- | ------------------------- |
| Normal (1x1)        | `\x00`    | `\x1D\x21\x00` | `Texto normal`            |
| Doble altura (1x2)  | `\x01`    | `\x1D\x21\x01` | `T E X T O   D O B L E`   |
| Doble ancho (2x1)   | `\x10`    | `\x1D\x21\x10` | `TEXTO  ANCHO`            |
| Triple altura (1x3) | `\x02`    | `\x1D\x21\x02` | `T   E   X   T   O`       |
| Personalizado (3x2) | `\x12`    | `\x1D\x21\x12` | `TEXTO  GIGANTE`          |

---

### **Ejemplo Simulado de Comanda Optimizada**

Imaginemos una línea de productos en una impresora de **80mm** (≈48 caracteres por línea en Font A):

```typescript
const commands = [
  '\x1B\x4D\x01', // Usar Font B (más compacta)
  '\x1B\x61\x01', // Centrar
  '\x1D\x21\x11', // Doble tamaño (2x2)
  'COMANDA COCINA\n',
  '\x1D\x21\x00', // Volver a normal
  '\x1B\x4D\x00', // Font A
  '--------------------------------\n',
  '\x1B\x45\x01', // Negrita
  'PRODUCTO'.padEnd(35) + 'CANT\n', // 35 caracteres para nombre
  '\x1B\x45\x00',
  ...orderData.products.map(
    (p) =>
      `${p.name.substring(0, 35).padEnd(35)} x${p.quantity.toString().padStart(3)}\n`,
  ),
  '\x1D\x56\x01', // Corte total
].join('');
```

#### **Resultado Visual** (Simulación para 80mm):

```
        COMANDA COCINA
--------------------------------
PRODUCTO                         CANT
Hamburguesa clásica con queso    x  2
Ensalada César premium           x  1
Agua mineral sin gas 500ml       x  4
--------------------------------
```

---

### **Tips para Maximizar el Espacio**:

1. **Combina Font B con escalado**:
   - Font B permite más caracteres por línea (ideal para nombres largos).
   ```typescript
   '\x1B\x4D\x01' + '\x1D\x21\x10'; // Font B + doble ancho
   ```
2. **Ajusta columnas dinámicamente**:
   - Para 80mm, reserva 35-40 caracteres para el nombre y 5-8 para la cantidad.
3. **Usa separadores Unicode**:
   ```typescript
   '─'.repeat(48) + '\n'; // Línea continua con "─"
   ```
4. **Jerarquiza con tamaños**:
   - Encabezados en **2x2**, productos en **1x1**, y observaciones en **Font B**.

---

### **Prueba de Caracteres por Línea**

Imprime esto para calibrar tu impresora:

```typescript
'1234567890'.repeat(5) + '\n'; // 50 caracteres (Font A)
```

- Si se ven completos, ¡tienes espacio para jugar con el formato!
