import { create } from "zustand";
import { io } from "socket.io-client";
import { ITable } from "../Interfaces/ITable";
import { getTableByRoom } from "@/api/tables";

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
  const socket = io("http://192.168.0.50:3000"); // Usa la IP de tu backend
  // const socket = io("http://localhost:3000"); // Usa la IP de tu backend

  socket.on("connect", () => {
    console.log("✅ Conectado a WebSocket");
  });

  socket.on("tableCreated", (data) => {
    set((state) => ({ tables: [...state.tables, data] }));
  });

  socket.on("tableUpdated", (data) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === data.id ? data : table
      ),
    }));
  });

  socket.on("tableDeleted", (data) => {
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== data.id),
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ Desconectado del servidor WebSocket");
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
    connectWebSocket: () => { }, // La conexión se establece al cargar el store
    updateTablesByRoom,
  };
});
