import { create } from "zustand";
import { ITable } from "../Interfaces/ITable";
import { getTableByRoom } from "@/api/tables";
import { webSocketService } from "@/services/websocket.service";

/** El backend por REST mapea orders → UUID[], pero por WS puede mandar entidades Order[]. */
function normalizeTablePayload(data: any): ITable {
  const orders = Array.isArray(data?.orders)
    ? data.orders
        .map((o: string | { id?: string }) =>
          typeof o === "string" ? o : o?.id
        )
        .filter((id: string | undefined): id is string => !!id)
    : data?.orders ?? null;

  return { ...data, orders };
}

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

let tableListenersBound = false;

export const useTableStore = create<TableStateZustand>((set, get) => {
  const bindTableListeners = () => {
    if (tableListenersBound) return;
    tableListenersBound = true;

    const socket = webSocketService.connect();
    let hasConnectedBefore = false;

    socket.on("connect", () => {
      if (hasConnectedBefore) {
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
      const table = normalizeTablePayload(data);
      const roomId = (table as any)?.room?.id as string | undefined;
      set((state) => {
        const newByRoom = { ...state.tablesByRoom };
        if (roomId && newByRoom[roomId]) {
          newByRoom[roomId] = [...newByRoom[roomId], table];
        }
        const tables =
          state.currentRoomId === roomId
            ? [...state.tables, table]
            : state.tables;
        return { tablesByRoom: newByRoom, tables };
      });
    });

    webSocketService.on("tableUpdated", (data: ITable & { room?: { id: string } }) => {
      const table = normalizeTablePayload(data);
      const roomId = (table as any)?.room?.id as string | undefined;
      set((state) => {
        const newByRoom = { ...state.tablesByRoom };
        const effectiveRoomId =
          roomId ??
          Object.keys(newByRoom).find((rId) =>
            newByRoom[rId].some((t) => t.id === table.id)
          );

        if (effectiveRoomId && newByRoom[effectiveRoomId]) {
          newByRoom[effectiveRoomId] = newByRoom[effectiveRoomId].map((t) =>
            t.id === table.id ? { ...t, ...table } : t
          );
        }

        const tables =
          state.currentRoomId === effectiveRoomId
            ? state.tables.map((t) => (t.id === table.id ? { ...t, ...table } : t))
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
  };

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
      set((state) => {
        const newByRoom = { ...state.tablesByRoom };
        for (const rId of Object.keys(newByRoom)) {
          if (newByRoom[rId].some((t) => t.id === updatedTable.id)) {
            newByRoom[rId] = newByRoom[rId].map((t) =>
              t.id === updatedTable.id ? updatedTable : t
            );
          }
        }
        return {
          tables: state.tables.map((t) =>
            t.id === updatedTable.id ? updatedTable : t
          ),
          tablesByRoom: newByRoom,
        };
      }),
    connectWebSocket: () => {
      webSocketService.connect();
      bindTableListeners();
    },
    updateTablesByRoom,
  };
});
