import { create } from "zustand";
import { io } from "socket.io-client";
import { IStock, IStockOfProduct, SelectedItem } from "../Interfaces/IStock";

interface StockState {
  stocks: IStockOfProduct[];
  selectedItem: SelectedItem | null;
  setStocks: (stocks: IStockOfProduct[]) => void;
  setSelectedItem: (item: SelectedItem) => void;
  clearSelectedItem: () => void;
  addStock: (stock: IStockOfProduct) => void;
  updateStock: (updatedStock: IStockOfProduct) => void;
  deductStock: (stock: IStockOfProduct) => void;
  connectWebSocket: () => void;
}

export const useStockStore = create<StockState>((set) => {
  const socket = io("http://192.168.100.133:3000"); // Ajusta la URL de tu backend

  // Conexión WebSocket
  socket.on("connect", () => {
    console.log("✅ [WebSocket] Conectado al servidor de Stocks");
  });

  // Manejo de eventos de WebSocket
  socket.on("stock.created", (data: IStockOfProduct) => {
    console.log("🟢 [WebSocket] Evento stock.created recibido:", data);
    set((state) => {
      const exists = state.stocks.some(stock => stock.id === data.id);
      if (!exists) {
        console.log("🆕 [WebSocket] Añadiendo nuevo stock al estado");
        return { stocks: [...state.stocks, data] };
      }
      console.log("⏭️ [WebSocket] El stock ya existe en el estado, no se añade");
      return state;
    });
  });

  socket.on("stock.updated", (data: IStockOfProduct) => {
    console.log("🟡 [WebSocket] Evento stock.updated recibido:", data);
    set((state) => ({
      stocks: state.stocks.map(stock => {
        if (stock.id === data.id) {
          console.log("🔄 [WebSocket] Actualizando stock existente");
          return data;
        }
        return stock;
      })
    }));
  });

  socket.on("stock.deducted", (data: IStockOfProduct) => {
    console.log("🔴 [WebSocket] Evento stock.deducted recibido:", data);
    set((state) => ({
      stocks: state.stocks.map(stock => {
        if (stock.id === data.id) {
          console.log("➖ [WebSocket] Actualizando cantidad de stock deducido");
          return { 
            ...stock, 
            quantityInStock: data.quantityInStock 
          };
        }
        return stock;
      })
    }));
  });

  socket.on("disconnect", () => {
    console.log("❌ [WebSocket] Desconectado del servidor de Stocks");
  });

  return {
    stocks: [],
    selectedItem: null,
    
    // Setters básicos
    setStocks: (stocks: IStockOfProduct[]) => {
      console.log("📦 [Store] Actualizando lista completa de stocks:", stocks);
      set({ stocks });
    },
    
    setSelectedItem: (item: SelectedItem) => {
      console.log("🎯 [Store] Estableciendo ítem seleccionado:", item);
      set({ selectedItem: item });
    },
    
    clearSelectedItem: () => {
      console.log("🧹 [Store] Limpiando ítem seleccionado");
      set({ selectedItem: null });
    },
    
    // Acciones para modificar el stock
    addStock: (stock: IStockOfProduct) => {
      console.log("➕ [Store] Añadiendo nuevo stock:", stock);
      set((state) => ({ 
        stocks: [...state.stocks, stock],
        selectedItem: null
      }));
    },
    
    updateStock: (updatedStock: IStockOfProduct) => {
      console.log("🔄 [Store] Actualizando stock existente:", updatedStock);
      set((state) => ({
        stocks: state.stocks.map(stock =>
          stock.id === updatedStock.id ? updatedStock : stock
        ),
        selectedItem: null
      }));
    },
    
    deductStock: (stock: IStockOfProduct) => {
      console.log("➖ [Store] Deducir stock:", stock);
      set((state) => ({
        stocks: state.stocks.map(s => {
          if (s.id === stock.id) {
            console.log(`🔢 [Store] Actualizando cantidad de ${s.quantityInStock} a ${stock.quantityInStock}`);
            return { 
              ...s, 
              quantityInStock: stock.quantityInStock 
            };
          }
          return s;
        })
      }));
    },
    
    connectWebSocket: () => {
      console.log("🔌 [Store] Función connectWebSocket llamada (la conexión ya está establecida)");
    },
  };
});