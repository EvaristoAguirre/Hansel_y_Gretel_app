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

- [x] **4. `app/context/authContext.tsx` ~162 — `setTimeout` sin cleanup en expiración de token**
  **Resuelto (Fase 4, 24/09/2026):** los timers se guardan y se limpian en el cleanup del efecto.

- [x] **5. `app/context/order.context.tsx` ~1032 — `useMemo` del contexto con closures obsoletos**
  **Resuelto (Fase 4, 24/09/2026):** handlers en `useCallback` + deps del `useMemo`; cancelar usa `selectedTableRef`.

- [x] **6. `app/context/order.context.tsx` ~1018 — `handleDeleteOrder` sin header `Authorization`**
  **Resuelto (Fase 4, 24/09/2026):** `DELETE` con `Bearer` y chequeo de `response.ok`.

- [x] **7. `components/Table/TableEditor.tsx` ~189 — `handleEditOrder` fire-and-forget sin `await`**
  **Resuelto (Fase 4, 24/09/2026):** `await` + Swal de éxito solo si termina bien; botón deshabilitado mientras guarda.

- [x] **8. `app/context/room.context.tsx` ~210 — `setOrderSelectedTable` sin guard de null**
  **Resuelto (Fase 4, 24/09/2026):** si `current` es `null`, no hace spread.

- [x] **9. `app/context/dailyCashContext.tsx` ~119 — `closeCash` con non-null assertion sin validación**
  **Resuelto (Fase 4, 24/09/2026):** Swal y return si no hay caja seleccionada.

- [x] **10. `components/Order/useOrderStore.ts` ~86 — `findOrderByTableId` sin guard de null**
  ~~Accede a `order.table.id` asumiendo que `table` siempre está populada.~~  
  **Resuelto (Fase 1, 10/08/2026):** usa `order.table?.id`.

---

## PERFORMANCE

- [x] **11. `useOrderStore.ts` + 4 stores — Listeners WS registrados al importar el módulo**  
  **Resuelto (Fase 3, 24/09/2026):** listeners en `connectWebSocket` con flag de módulo.

- [x] **12. Todos los contextos (`authContext`, `dailyCashContext`, `room.context`, `ingredientsContext`, `unitOfMeasureContext`) — Context `value` sin `useMemo`**  
  **Resuelto (Fase 3, 24/09/2026):** `useMemo` del `value` + `useCallback` de los handlers.

- [x] **13. `app/context/order.context.tsx` ~133 — `useTableStore()` y `useOrderStore()` sin selector**  
  **Resuelto (Fase 3, 24/09/2026):** selectores por dato/acción.

- [x] **14. `components/Utils/DataGridComponent.tsx` ~21 — `console.log` + transformación en cada render**
  **Resuelto (28/09/2026):** se quitó el `console.log` y las filas capitalizadas se memorizan con `useMemo`.

- [x] **15. `components/Order/Order.tsx` ~57 — Total calculado con `useEffect + setState` en lugar de `useMemo`**
  **Resuelto (28/09/2026):** el total sale de `sumOrderLines` en `useMemo`. Lista vacía queda en `$0` sin un render intermedio.

- [x] **16. `components/Hooks/useTable.ts` ~61 — `useEffect` depende de `orders`**  
  **Resuelto (Fase 3, 24/09/2026):** el efecto depende de `salaId` y token.

- [x] **17. `components/Table/Table.tsx` ~50 — Fetch de mesas duplicado**  
  **Resuelto (Fase 3, 24/09/2026):** un solo fetch desde `useTable`.

- [x] **18. Toda la codebase `components/` — Cero usos de `React.memo`**
  **Resuelto (28/09/2026):** `memo` en los componentes de lista que el ítem nombra: `TableCard`, la fila de pedido confirmado y `DataGridComponent`. Los callbacks de mesa que reciben esas tarjetas van en `useCallback`.

- [x] **19. `components/Hooks/useProducts.ts` ~30 — Carga de 500 productos de inicio**
  **Resuelto (28/09/2026):** el catálogo de administración llega en páginas de 50 (tope 500) y la petición en curso se comparte. Quien solo necesita el socket o un refresh posterior no dispara la carga al montar.

- [x] **20. `ingredientsContext.tsx` + `unitOfMeasureContext.tsx` — Múltiples fetches paralelos en mount sin deduplicación**
  **Resuelto (28/09/2026):** cada contexto pide sus listas en un solo `Promise.all` y reutiliza la promesa en curso para el mismo token. El efecto depende de `accessToken` / `isAuthLoaded`.

---

## MEDIOS

- [x] **21. `components/Order/useOrderStore.ts` ~38 — Campo `status` en lugar de `state`**
  ~~`orderUpdatedPending` y `orderTicketPrinted` escriben `status`.~~  
  **Resuelto (Fase 1, 10/08/2026):** escriben `state` (`OrderState`).

- [x] **22. `components/Order/useOrderStore.ts` ~67 — `orderTicketPrinted` usa payload distinto**
  **Resuelto:** `orderTicketPrinted` pasa por `normalizeOrderPayload` (`data.order || data`), igual que el resto de los handlers.

- [x] **23. `app/context/ingredientsContext.tsx` ~118 — `removeIngredient` con lógica incorrecta**
  **Resuelto (28/09/2026):** la lista de ingredientes se actualiza según `isTopping` del ítem borrado, no del formulario abierto.

- [x] **24. `app/context/dailyCashContext.tsx` ~160 — Mensaje Swal incorrecto**
  **Resuelto:** al eliminar una caja el aviso dice "Caja eliminada correctamente."

- [x] **25. `app/context/order.context.tsx` ~463 — `setState` anidado en updater**
  **Resuelto (28/09/2026):** `updateToppingForUnit` calcula el grupo y después actualiza la lista plana, fuera del updater.

- [x] **26. `components/Order/OrderEditor.tsx` ~345 — Búsqueda sin debounce**
  **Resuelto (28/09/2026):** el cambio de categoría espera 350 ms y una búsqueda más nueva descarta la respuesta anterior.

- [x] **27. `app/context/room.context.tsx` ~108 — `handleSaveRoom` usa `fetch` directo**
  **Resuelto (28/09/2026):** crear y editar sala usan `apiFetch` (timeout y error unificado).

- [x] **28. `api/dailyCash.ts`, `api/metrics.ts`, `api/categories.ts` — `response.json()` sin verificar `response.ok`**
  **Resuelto (28/09/2026):** `readJson` rechaza el body si el status no es exitoso. Las métricas no pintan ese error como datos.

- [x] **29. `app/context/authContext.tsx` ~138 — `validateUserSession` y `handleSignOut` sin `useCallback`**
  **Resuelto:** ambas funciones ya están en `useCallback` y entran al `useMemo` del provider.

- [x] **30. `app/context/ingredientsContext.tsx` ~81 — `useEffect` sin dependencia de auth**
  **Resuelto (28/09/2026):** ingredientes y unidades esperan `isAuthLoaded` y `accessToken`. Si el token llega después del primer render, las listas se piden en ese momento.

---

## BAJOS / MEJORAS

- [x] **31. `console.log` de debug en producción**
  **Resuelto (28/09/2026):** se quitaron los logs de conexión WS y el de editar caja. Los `console.error` de fallos reales se mantienen.

- [x] **32. Imports sin usar**
  **Resuelto (28/09/2026):** se quitó `LoadingLottie` en `Rooms.tsx` y `use` en `OrderEditor.tsx`. `getTableByRoom`, `fetchDailyCashByID` y `use` en `order.context` ya no estaban importados.

- [x] **33. `components/Table/StepperTable.tsx` ~105 — `imprimirComanda()` función vacía (dead code)**
  **Resuelto (28/09/2026):** se eliminó la función y la prop que `Order` no usaba.

- [x] **34. `tsconfig.json` — `allowJs: true`**
  **Resuelto (28/09/2026):** `URI.js` pasó a `URI.ts` y `allowJs` quedó en `false`.

- [x] **35. `next.config.ts` — Configuración `i18n` de Pages Router en App Router (Next 15)**
  **Resuelto (28/09/2026):** se quitó `i18n` (Next avisaba que no aplica en App Router) y `next-i18next.config.js`.

- [x] **36. `components/Table/StepperTable.tsx` ~89 — `handleCompleteStep` con closure no funcional**
  **Resuelto (28/09/2026):** `setCompleted` usa la forma funcional del setter.

---

## Prioridades de corrección recomendadas

1. ✅ `useCategoryStore.ts` — filtro invertido (rompe la UI en producción)
2. ✅ `Pay.tsx` — guard anti-doble-submit (impacto económico directo)
3. ✅ `websocket.service.ts` — deduplicar listeners en reconexión
4. ✅ `authContext.tsx` — cleanup de `setTimeout`
5. ✅ `order.context.tsx` — completar dependencias del `useMemo` y fix del DELETE sin token
6. ✅ Context values — `useMemo` en los 5 contextos restantes
7. ✅ Zustand — selectores para reducir re-renders del provider de pedidos
