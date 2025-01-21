
import { URI_PRODUCT } from "@/components/URI/URI";
import { ProductCreated, ProductForm } from '../components/Interfaces/IProducts';


export const createProduct = async (form: ProductCreated) => {
  const response = await fetch(URI_PRODUCT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const editProduct = async (form: ProductForm) => {
    const response = await fetch(`${URI_PRODUCT}/${form.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    return await response.json();
};


export const fetchProducts = async () => {
    const response = await fetch(URI_PRODUCT, { method: "GET" });
    const data = await response.json();
    return data;
};
