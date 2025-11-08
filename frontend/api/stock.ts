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

  const data = await response.json();

  return {
    statusCode: response.status,
    ...data,
  };
};





//para editar stock necesito el id
export const editStock = async (idStock: string, payload: IStock, token: string) => {
  const response = await fetch(`${URI_STOCK}/${idStock}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return {
    statusCode: response.status,
    ...data,
  };
};

//para sumar stock a stock existente
export const addStockToExisting = async (idStock: string, payload: { quantityToAdd: number; minimumStock?: number }, token: string) => {
  const response = await fetch(`${URI_STOCK}/${idStock}/add`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  return {
    statusCode: response.status,
    ...data,
  };
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