import { IStock, IStockOfProduct } from "@/components/Interfaces/IStock";
import { URI_STOCK } from "@/components/URI/URI";
import { useStockStore } from "@/components/Stock/useStockStore";

export const addStock = async (formStock: IStock, token: string) => {
  try {
    const response = await fetch(URI_STOCK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(formStock),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data: IStockOfProduct = await response.json();
    console.log("🟢 [addStock] Stock creado exitosamente:", data);

    // Actualizar el store
    useStockStore.getState().addStock(data);
    console.log("📦 [addStock] Stock añadido al store global");

    return data;
  } catch (error) {
    console.error("🔴 [addStock] Error al crear stock:", error);
    throw error;
  }
};


//para editar stock necesito el id de la orden
// export const editStock = async (idStock: string, payload: IStock, token: string) => {
//   const response = await fetch(`${URI_STOCK}/${idStock}`, {
//     method: "PATCH",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${token}`,
//     },
//     body: JSON.stringify(payload),
//   });

//   return await response.json();
// };


export const editStock = async (idStock: string, payload: IStock, token: string) => {
  try {
    console.log("📤 [editStock] Actualizando stock ID:", idStock, "con datos:", payload);
    const response = await fetch(`${URI_STOCK}/${idStock}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data: IStockOfProduct = await response.json();
    console.log("🟡 [editStock] Stock actualizado exitosamente:", data);
    
    // Actualizar el store
    useStockStore.getState().updateStock(data);
    console.log("📦 [editStock] Stock actualizado en el store global");
    
    return data;
  } catch (error) {
    console.error("🔴 [editStock] Error al actualizar stock:", error);
    throw error;
  }
};



export const getStockByProduct = async (id: string, token: string) => {
  const response = await fetch(`${URI_STOCK}/product/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const getIdStockFromProduct = async (id: string, token: string) => {
  const idStock = await getStockByProduct(id, token);
  return idStock.id;
};

export const getStockByIngredient = async (id: string, token: string) => {
  const response = await fetch(`${URI_STOCK}/ingredient/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const getIdStockFromIngredient = async (id: string, token: string) => {
  const idStock = await getStockByIngredient(id, token);
  return idStock.id;
};