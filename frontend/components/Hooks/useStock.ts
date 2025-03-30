import { useEffect, useState } from "react";
import { IStock } from "../Interfaces/IStock";
import { useStockStore } from "../Stock/useStockStore";
import Swal from "sweetalert2";
import { useAuth } from "@/app/context/authContext";
import { URI_STOCK } from "../URI/URI";
// import { updateStockAPI, createStockAPI, deleteStockAPI } from "@/api/stock"; // Estos métodos son ejemplos de la API que deberías tener

export const useStock = () => {
  const { getAccessToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<IStock | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"create" | "edit">("create");

  //   const [form, setForm] = useState<IStock>({
  //     id: "",
  //     quantityInStock: 0,
  //     minimumStock: 0,
  //     product: { id: "", name: "" },
  //     ingredient: { id: "", name: "" },
  //     unitOfMeasure: { id: "", name: "" },
  //   });

  const { stocks, updateStock, setStocks, addStock, connectWebSocketStock } = useStockStore();

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setToken(token);
    }
    async function fetchStocks() {
      try {
        const response = await fetch(URI_STOCK, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setStocks(data);
        console.log("Stocks:", data);
      } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los stocks.", "error");
        console.error(error);
      }
    }

    fetchStocks();
    connectWebSocketStock();
  }, [setStocks, connectWebSocketStock]);

  const handleCreateStock = async (stockData: IStock) => {
    try {
      const response = await fetch(URI_STOCK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(stockData),
      });
      const data = await response.json();
      addStock(data);
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo crear el stock.", "error");
    }
  };

//   const handleEdit = async (id: string, data: IStock) => {
//     if (!id) {
//       Swal.fire("Error", "ID de stock no válido.", "error");
//       return;
//     }
//     try {
//       const response = await updateStockAPI(id, data, token);
//       const updatedStock = await response.json();
//       updateStock(updatedStock);
//       Swal.fire("Éxito", "Stock actualizado correctamente.", "success");
//     //   handleCloseModal();
//     } catch (error) {
//       console.error(error);
//       Swal.fire("Error", "No se pudo actualizar el stock.", "error");
//     }
//   };

  return {
    stocks,
    selectedStock,
    modalOpen,
    modalType,
    setSelectedStock,
    connectWebSocketStock,
  };
};

export default useStock;
