import { IStock } from "@/components/Interfaces/IStock";
import { URI_STOCK } from "@/components/URI/URI";

export const addStock = async (formStock: IStock, token: string) => {
  const response = await fetch(URI_STOCK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(formStock),
  });

  return await response.json();
};


//para editar stock necesito el id de la orden
export const editStock = async (idStock: string, payload: IStock, token: string) => {
  const response = await fetch(`${URI_STOCK}/${idStock}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
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