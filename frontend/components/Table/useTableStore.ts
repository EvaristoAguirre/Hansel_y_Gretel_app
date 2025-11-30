import { create } from "zustand";
import { ITable } from "../Interfaces/ITable";
import { getTableByRoom } from "@/api/tables";
import { webSocketService } from "@/services/websocket.service";

interface TableStateZustand {
  tables: ITable[];
  setTables: (tables: ITable[]) => void;
  addTable: (table: ITable) => void;
  removeTable: (id: string) => void;
  updateTable: (updatedTable: ITable) => void;
  connectWebSocket: () => void;
  updateTablesByRoom: (salaId: string, token: string) => Promise<void>;
}

export const useTableStore = create<TableStateZustand>((set) => {
  // Conectar al servicio centralizado de WebSocket
  const socket = webSocketService.connect();

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket - Mesas");
  });

  webSocketService.on("tableCreated", (data) => {
    set((state) => ({ tables: [...state.tables, data] }));
  });

  webSocketService.on("tableUpdated", (data) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === data.id ? data : table
      ),
    }));
  });

  webSocketService.on("tableDeleted", (data) => {
    set((state) => ({
      tables: state.tables.filter((table) => table.id === data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket - Mesas");
  });

  const updateTablesByRoom = async (salaId: string, token: string) => {
    const tables = await getTableByRoom(token, salaId);
    set({ tables });
  };

  return {
    tables: [],
    setTables: (tables) => set({ tables }),
    addTable: (table) => set((state) => ({ tables: [...state.tables, table] })),
    removeTable: (id) =>
      set((state) => ({ tables: state.tables.filter((t) => t.id !== id) })),
    updateTable: (updatedTable) =>
      set((state) => ({
        tables: state.tables.map((t) =>
          t.id === updatedTable.id ? updatedTable : t
        ),
      })),
    connectWebSocket: () => {
      // La conexión se establece automáticamente al cargar el store
      webSocketService.connect();
    },
    updateTablesByRoom,
  };
});
