//Comandos

// Aquí tienes una lista de comandos ESC/POS compatibles con impresoras térmicas 3nStar (y la mayoría de modelos que usan este estándar). Los comandos están en formato hexadecimal y se enfocan en formato de texto:

// ---

// ### **Inicialización y Configuración Básica**
// 1. **Inicializar impresora**
//    `\x1B\x40`
//    *Reinicia configuraciones predeterminadas*.

// Alineación de Texto
// 2. Alinear a la izquierda
//    `\x1B\x61\x00`
// 3. Centrar texto
//    `\x1B\x61\x01`
// 4. Alinear a la derecha
//    `\x1B\x61\x02`

// Tamaño y Estilo de Fuente
// 5. Texto en tamaño normal
//    `\x1D\x21\x00`
// 6. Doble altura
//    `\x1D\x21\x01`
// 7. Doble ancho
//    `\x1D\x21\x10`
// 8. Doble altura y ancho
//    `\x1D\x21\x11`
// 9. Negrita (activar)
//    `\x1B\x45\x01`
// 10. Negrita (desactivar)
//     `\x1B\x45\x00`
// 11. Subrayado (activar)
//     `\x1B\x2D\x01`
// 12. Subrayado doble (activar)
//     `\x1B\x2D\x02`
// 13. Subrayado (desactivar)
//     `\x1B\x2D\x00`

// Fuentes Alternativas
// 14. Usar Font A (predeterminada)
//     `\x1B\x4D\x00`
// 15. Usar Font B
//     `\x1B\x4D\x01`

// Espaciado
// 16. Ajustar espaciado entre caracteres
//     `\x1B\x20[n]`
//     Reemplaza `[n]` por un valor en hex (ej: `\x05` para 5 puntos).
// 17. Ajustar espaciado entre líneas
//     `\x1B\x33[n]`
//     Reemplaza `[n]` por un valor en hex (ej: `\x30` para 48 puntos).

// Efectos Especiales
// 18. Impresión invertida (blanco sobre negro
//     `\x1D\x42\x01`
// 19. Desactivar impresión invertida
//     `\x1D\x42\x00`
// 20. Rotar texto 90°
//     `\x1B\x56\x01`
// 21. Desactivar rotación
//     `\x1B\x56\x00`

// Corte de Papel
// 22. Corte parcial
//     `\x1D\x56\x00`
// 23. Corte total
//     `\x1D\x56\x01`

// Códigos de Barras (Ejemplo)
// 24. Imprimir código de barras Code128
//     ```
//     \x1D\x6B\x08ABCD1234\x00
//     ```
//     Configura altura con `\x1D\x68[n]` y posición con `\x1D\x48[n]`.

// Notas Importantes
//Formato hexadecimal: Los comandos usan secuencias de escape en hexadecimal (ej: `\x1B` = ESC).
// Para impresoras de 80mm:
// 80mm	40-48 caracteres por línea
// 58mm	32-40 caracteres por línea
