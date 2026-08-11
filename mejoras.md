# Mejoras y correcciones pendientes — Hansel y Gretel App

Auditoría realizada el 23/06/2026. Cada ítem incluye archivo, descripción del problema y casilla de seguimiento.

---

## CRÍTICOS

- [x] **1. `useCategoryStore.ts` ~34 — Filtro invertido en WS `categoryDeleted`**
  El handler del evento WebSocket usa `category.id === data.id` en lugar de `!==`. Al borrar una categoría por WS, se eliminan todas las demás y queda solo la borrada. El menú de pedidos queda en blanco.

- [x] **2. `components/Order/Pay.tsx` ~328 — Sin guard de doble click en cobro**
  `handlePayOrder` no tiene estado `isSubmitting`. Un doble click o doble tap puede ejecutar dos llamadas a `orderToClosed`, cerrando la orden dos veces en caja. Crítico en POS de producción.

- [x] **3. `services/websocket.service.ts` ~53 — Listeners WS duplicados en reconexión**
  ~~Cada vez que el socket se reconecta se agregan nuevos handlers sin remover los anteriores.~~  
  **Resuelto (Fase 1, 10/08/2026):** se eliminó el re-registro en `reconnect`; API `onReconnect` para resync/re-join.

- [ ] **4. `app/context/authContext.tsx` ~162 — `setTimeout` sin cleanup en expiración de token**
  Al desmontar el componente o cambiar de token, los timers de aviso y logout siguen activos → múltiples Swal de "sesión próxima a vencer" y redirecciones fantasma. Memory leak en sesiones largas.

- [ ] **5. `app/context/order.context.tsx` ~1032 — `useMemo` del contexto con closures obsoletos**
  `handleCreateOrder`, `handleCancelOrder`, `handleEditOrder` no están en las dependencias del `useMemo`. Los handlers capturan `selectedTable` viejo si este cambió entre renders → mesa incorrecta al cancelar o actualizar.

- [ ] **6. `app/context/order.context.tsx` ~1018 — `handleDeleteOrder` sin header `Authorization`**
  El `fetch` de `DELETE` no incluye el header `Bearer token`. El backend debería rechazarlo; si no lo hace, es una vulnerabilidad de autorización.

- [ ] **7. `components/Table/TableEditor.tsx` ~189 — `handleEditOrder` fire-and-forget sin `await`**
  No usa `await`, muestra "Cambios Guardados" antes de que termine el PATCH. Doble click guarda dos veces y un error de red muestra éxito falso.

- [ ] **8. `app/context/room.context.tsx` ~210 — `setOrderSelectedTable` sin guard de null**
  Hace `{ ...selectedTable, orders: newOrder }` sin validar que `selectedTable` no sea `null`. Si se llama antes de seleccionar mesa → crash por spread de null.

- [ ] **9. `app/context/dailyCashContext.tsx` ~119 — `closeCash` con non-null assertion sin validación**
  Usa `selectedDailyCashId!` sin verificar que el valor exista. Si es `undefined`, el PATCH falla silenciosamente o cierra la caja incorrecta.

- [x] **10. `components/Order/useOrderStore.ts` ~86 — `findOrderByTableId` sin guard de null**
  ~~Accede a `order.table.id` asumiendo que `table` siempre está populada.~~  
  **Resuelto (Fase 1, 10/08/2026):** usa `order.table?.id`.

---

## PERFORMANCE

- [ ] **11. `useOrderStore.ts` + 4 stores — Listeners WS registrados al importar el módulo**
  5 stores + 1 contexto + `websocket.service` = hasta 7 capas de handlers para el mismo evento WS. Los listeners se registran al importar el módulo y nunca se pueden remover.

- [ ] **12. Todos los contextos (`authContext`, `dailyCashContext`, `room.context`, `ingredientsContext`, `unitOfMeasureContext`) — Context `value` sin `useMemo`**
  El objeto `value` se crea inline en cada render → todos los consumidores del contexto se re-renderizan ante cualquier cambio de estado interno del provider, sin importar si el dato que usan cambió.

- [ ] **13. `app/context/order.context.tsx` ~133 — `useTableStore()` y `useOrderStore()` sin selector**
  El provider de pedidos se suscribe al store completo. Se re-renderiza ante cualquier cambio de mesas u órdenes globales. Debería usar `useTableStore(s => s.tables)`.

- [ ] **14. `components/Utils/DataGridComponent.tsx` ~21 — `console.log` + transformación en cada render**
  `console.log(rows)` en cada render + `capitalizeFirstLetterTable(rows)` crea un nuevo array en cada render → el DataGrid recibe siempre una referencia nueva de `rows` y se re-renderiza completo.

- [ ] **15. `components/Order/Order.tsx` ~57 — Total calculado con `useEffect + setState` en lugar de `useMemo`**
  Provoca un flash de `$0` y un render extra innecesario en cada cambio de productos confirmados.

- [ ] **16. `components/Hooks/useTable.ts` ~61 — `useEffect` depende de `orders`**
  Cada cambio en el store de pedidos re-ejecuta `updateTablesByRoom` + `connectWebSocket` → fetches en cascada hacia el backend.

- [ ] **17. `components/Table/Table.tsx` ~50 — Fetch de mesas duplicado**
  Llama `updateTablesByRoom` además del que ya hace `useTable` → doble request al backend cada vez que cambia la sala.

- [ ] **18. Toda la codebase `components/` — Cero usos de `React.memo`**
  En 105 archivos no hay ningún `React.memo`. Componentes de lista (`TableCard`, filas de pedido, DataGrid) se re-renderizan en cada cambio del contexto padre.

- [ ] **19. `components/Hooks/useProducts.ts` ~30 — Carga de 500 productos de inicio**
  `fetchProducts('1','500')` en vistas de administración. Pesado en dispositivos lentos o redes lentas.

- [ ] **20. `ingredientsContext.tsx` + `unitOfMeasureContext.tsx` — Múltiples fetches paralelos en mount sin deduplicación**
  2-3 fetches solapados al montar el contexto, sin verificar si los datos ya están disponibles.

---

## MEDIOS

- [x] **21. `components/Order/useOrderStore.ts` ~38 — Campo `status` en lugar de `state`**
  ~~`orderUpdatedPending` y `orderTicketPrinted` escriben `status`.~~  
  **Resuelto (Fase 1, 10/08/2026):** escriben `state` (`OrderState`).

- [ ] **22. `components/Order/useOrderStore.ts` ~67 — `orderTicketPrinted` usa payload distinto**
  Accede a `data.id` directamente, mientras que otros handlers usan `data.order || data`. Si el formato del payload cambia, la actualización no se aplica.

- [ ] **23. `app/context/ingredientsContext.tsx` ~118 — `removeIngredient` con lógica incorrecta**
  Usa `formIngredients.isTopping` (del formulario activo) para decidir qué lista actualizar, en lugar del atributo `isTopping` del ingrediente eliminado.

- [ ] **24. `app/context/dailyCashContext.tsx` ~160 — Mensaje Swal incorrecto**
  Al eliminar una caja dice "Producto eliminado" (copy-paste).

- [ ] **25. `app/context/order.context.tsx` ~463 — `setState` anidado en updater**
  `setSelectedToppingsByProduct` es llamado dentro del updater de `setToppingsByProductGroup` → doble render y batching inconsistente en React 18.

- [ ] **26. `components/Order/OrderEditor.tsx` ~345 — Búsqueda sin debounce**
  El `useEffect` en `selectedCats` lanza una búsqueda sin debounce ni cleanup de request anterior → race condition si el usuario cambia categoría rápido.

- [ ] **27. `app/context/room.context.tsx` ~108 — `handleSaveRoom` usa `fetch` directo**
  No usa `apiFetch` (sin timeout, sin manejo unificado de errores), inconsistente con el resto del proyecto.

- [ ] **28. `api/dailyCash.ts`, `api/metrics.ts`, `api/categories.ts` — `response.json()` sin verificar `response.ok`**
  Múltiples funciones parsean la respuesta sin verificar el status HTTP, tratando respuestas de error como datos válidos.

- [ ] **29. `app/context/authContext.tsx` ~138 — `validateUserSession` y `handleSignOut` sin `useCallback`**
  El `value` del Provider recrea estas funciones en cada render → re-renders masivos de todo el árbol bajo `AuthProvider`.

- [ ] **30. `app/context/ingredientsContext.tsx` ~81 — `useEffect` sin dependencia de auth**
  Con `[]` como deps, si el token no está disponible al montar, los ingredientes nunca se cargan en sesiones tardías.

---

## BAJOS / MEJORAS

- [ ] **31. `console.log` de debug en producción**
  Presentes en: `websocket.service.ts`, `useOrderStore.ts`, `useTableStore.ts`, `useProductStore.ts`, `useIngredientStore.ts`, `useCategoryStore.ts`, `DataGridComponent.tsx`, `Products.tsx`, `CashTable.tsx`.

- [ ] **32. Imports sin usar**
  `getTableByRoom` en `Table.tsx`, `LoadingLottie` en `Rooms.tsx`, `use` de React en `order.context.tsx`, `fetchDailyCashByID` en `dailyCashContext.tsx`.

- [ ] **33. `components/Table/StepperTable.tsx` ~105 — `imprimirComanda()` función vacía (dead code)**
  Función declarada pero sin implementación.

- [ ] **34. `tsconfig.json` — `allowJs: true`**
  Permite mezclar JS sin tipos (como `URI.js`) con TS estricto, anulando parte de la seguridad de tipos.

- [ ] **35. `next.config.ts` — Configuración `i18n` de Pages Router en App Router (Next 15)**
  Patrón heredado de Pages Router que puede causar warnings o comportamiento inesperado.

- [ ] **36. `components/Table/StepperTable.tsx` ~89 — `handleCompleteStep` con closure no funcional**
  `setCompleted({ ...completed, [activeStep]: true })` no usa la forma funcional del setter → con clicks rápidos se pueden perder pasos completados.

---

## Prioridades de corrección recomendadas

1. ✅ `useCategoryStore.ts` — filtro invertido (rompe la UI en producción)
2. ✅ `Pay.tsx` — guard anti-doble-submit (impacto económico directo)
3. ⬜ `websocket.service.ts` — deduplicar listeners en reconexión
4. ⬜ `authContext.tsx` — cleanup de `setTimeout`
5. ⬜ `order.context.tsx` — completar dependencias del `useMemo` y fix del DELETE sin token
6. ⬜ Context values — `useMemo` en los 5 contextos restantes
7. ⬜ Zustand — selectores para reducir re-renders del provider de pedidos
