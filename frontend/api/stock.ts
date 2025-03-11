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