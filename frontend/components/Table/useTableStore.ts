import { create } from "zustand";
import { ITable } from "../Interfaces/ITable";
import { getTableByRoom } from "@/api/tables";
import { webSocketService } from "@/services/websocket.service";

interface TableStateZustand {
  /** Mesas de la sala actualmente seleccionada (para uso directo en los componentes). */
  tables: ITable[];
  /** Caché de mesas indexadas por sala. Evita re-fetchear cuando el WS mantiene los datos frescos. */
  tablesByRoom: Record<string, ITable[]>;
  /** ID de la sala cuyos datos están cargados en `tables`. */
  currentRoomId: string | null;
  /** Último token utilizado, guardado para poder re-fetchear en reconexión WS. */
  lastUsedToken: string | null;
  error: string | null;
  setTables: (tables: ITable[]) => void;
  setError: (msg: string | null) => void;
  addTable: (table: ITable) => void;
  removeTable: (id: string) => void;
  updateTable: (updatedTable: ITable) => void;
  connectWebSocket: () => void;
  updateTablesByRoom: (salaId: string, token: string) => Promise<void>;
}

export const useTableStore = create<TableStateZustand>((set, get) => {
  const socket = webSocketService.connect();

  // Detecta reconexión: el primer "connect" es la conexión inicial; los siguientes son reconexiones.
  let hasConnectedBefore = false;

  socket.on("connect", () => {
    if (hasConnectedBefore) {
      // Reconexión WS: invalida la caché de la sala actual y re-fetchea para recuperar
      // eventos que se hayan perdido durante el corte de conexión.
      const { currentRoomId, lastUsedToken, updateTablesByRoom } = get();
      if (currentRoomId && lastUsedToken) {
        set((s) => {
          const newByRoom = { ...s.tablesByRoom };
          delete newByRoom[currentRoomId];
          return { tablesByRoom: newByRoom };
        });
        updateTablesByRoom(currentRoomId, lastUsedToken);
      }
    }
    hasConnectedBefore = true;
    console.log("✅ Conectado a WebSocket - Mesas");
  });

  webSocketService.on("tableCreated", (data: ITable & { room?: { id: string } }) => {
    const roomId = (data as any)?.room?.id as string | undefined;
    set((state) => {
      const newByRoom = { ...state.tablesByRoom };
      if (roomId && newByRoom[roomId]) {
        newByRoom[roomId] = [...newByRoom[roomId], data];
      }
      const tables =
        state.currentRoomId === roomId
          ? [...state.tables, data]
          : state.tables;
      return { tablesByRoom: newByRoom, tables };
    });
  });

  webSocketService.on("tableUpdated", (data: ITable & { room?: { id: string } }) => {
    const roomId = (data as any)?.room?.id as string | undefined;
    set((state) => {
      const newByRoom = { ...state.tablesByRoom };
      if (roomId && newByRoom[roomId]) {
        newByRoom[roomId] = newByRoom[roomId].map((t) =>
          t.id === data.id ? data : t
        );
      }
      const tables =
        state.currentRoomId === roomId
          ? state.tables.map((t) => (t.id === data.id ? data : t))
          : state.tables;
      return { tablesByRoom: newByRoom, tables };
    });
  });

  webSocketService.on("tableDeleted", (data: { id: string }) => {
    set((state) => {
      const newByRoom: Record<string, ITable[]> = {};
      for (const [rId, tables] of Object.entries(state.tablesByRoom)) {
        newByRoom[rId] = tables.filter((t) => t.id !== data.id);
      }
      const tables = state.tables.filter((t) => t.id !== data.id);
      return { tablesByRoom: newByRoom, tables };
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Mesas");
  });

  const updateTablesByRoom = async (salaId: string, token: string) => {
    const state = get();

    // Si la sala ya está en caché Y el WS está conectado, los datos están frescos:
    // simplemente actualizamos `tables` y `currentRoomId` sin ir al backend.
    if (state.tablesByRoom[salaId] && webSocketService.isConnected()) {
      set({
        tables: state.tablesByRoom[salaId],
        currentRoomId: salaId,
        lastUsedToken: token,
        error: null,
      });
      return;
    }

    // Si no hay caché para esta sala (primera visita o invalidación por reconexión WS),
    // se hace el fetch al backend.
    try {
      const tables = await getTableByRoom(token, salaId);
      set((s) => ({
        tables,
        currentRoomId: salaId,
        lastUsedToken: token,
        tablesByRoom: { ...s.tablesByRoom, [salaId]: tables },
        error: null,
      }));
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "TIMEOUT"
          ? "Sin respuesta del servidor al cargar las mesas."
          : "No se pudieron cargar las mesas.";
      set({ error: msg });
    }
  };

  return {
    tables: [],
    tablesByRoom: {},
    currentRoomId: null,
    lastUsedToken: null,
    error: null,
    setError: (msg) => set({ error: msg }),
    setTables: (tables) => set({ tables }),
    addTable: (table) =>
      set((state) => ({ tables: [...state.tables, table] })),
    removeTable: (id) =>
      set((state) => ({
        tables: state.tables.filter((t) => t.id !== id),
      })),
    updateTable: (updatedTable) =>
      set((state) => ({
        tables: state.tables.map((t) =>
          t.id === updatedTable.id ? updatedTable : t
        ),
      })),
    connectWebSocket: () => {
      webSocketService.connect();
    },
    updateTablesByRoom,
  };
});
