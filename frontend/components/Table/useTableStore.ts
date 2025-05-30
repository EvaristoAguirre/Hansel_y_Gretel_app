import { create } from "zustand";
import { io } from "socket.io-client";
import { TableCreated } from "../Interfaces/ITable";

interface TableStateZustand {
  tables: TableCreated[];
  setTables: (tables: TableCreated[]) => void;
  addTable: (table: TableCreated) => void;
  removeTable: (id: string) => void;
  updateTable: (updatedTable: TableCreated) => void;
  connectWebSocket: () => void;
}

export const useTableStore = create<TableStateZustand>((set) => {
  const socket = io("http://localhost:3000"); // Usa la IP de tu backend

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket");
  });

  socket.on("tableCreated", (data) => {
    console.log("🟢 Nueva mesa creada:", data);
    set((state) => ({ tables: [...state.tables, data] }));
  });

  socket.on("tableUpdated", (data) => {
    console.log("🟡 Mesa actualizada:", data);
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === data.id ? data : table
      ),
    }));
  });

  socket.on("tableDeleted", (data) => {
    console.log("🔴 Mesa eliminada:", data);
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket");
  });

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
    connectWebSocket: () => { }, // La conexión se establece al cargar el store
  };
});
