import { create } from "zustand";
import { TableState } from "../Enums/Enums";
import { ISala } from "../Interfaces/Cafe_interfaces";
import { OrderDetailsCreated } from "../Order/useOrderDetailsStore";
import { OrderCreated } from "../Order/useOrderStore";
import { strict } from "assert";

export interface TableCreated {
  id: string;
  name: string;
  coment: string;
  number: number;
  // isActive: boolean;
  state: TableState;
  room: ISala;
  orders: string[];
}

interface TableStateZustand {
  tables: TableCreated[];
  setTables: (tables: TableCreated[]) => void;
  addTable: (table: TableCreated) => void;
  removeTable: (id: string) => void;
  updateTable: (updatedTable: TableCreated) => void;
  connectWebSocket: () => void;
}

export const useTableStore = create<TableStateZustand>((set) => ({
  tables: [],
  setTables: (tables) => (set({ tables })),

  addTable: (table) =>
    set((state) => ({ tables: [...state.tables, table] })),
  removeTable: (id) =>
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== id),
    })),
  updateTable: (updatedTable) =>
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === updatedTable.id ? updatedTable : table
      ),
    })),
  connectWebSocket: () => {
    const socket = new WebSocket("ws://localhost:3000");

    socket.onmessage = (event) => {
      const { action, data } = JSON.parse(event.data);

      set((state) => {
        switch (action) {
          case "table.created":
            return { tables: [...state.tables, data] };
          case "table.deleted":
            return {
              tables: state.tables.filter((tab) => tab.id !== data.id),
            };
          case "table.updated":
            return {
              tables: state.tables.map((tab) =>
                tab.id === data.id ? data : tab
              ),
            };
          default:
            return state;
        }
      });
    };

    socket.onopen = () => {
      console.log("WebSocket conectado - Table");
    };

    socket.onerror = (error) => {
      console.error("Error en WebSocket - Table:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket cerrado - Table");
    };
  },
}));
