
import { URI_PRODUCT, URI_PRODUCT_BY_CATEGORY } from "@/components/URI/URI";
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
// Para traer todos los productos en la cantidad por defecto(11, hasta indice 10)
// export const fetchProducts = async () => {
//   const response = await fetch(URI_PRODUCT, { method: "GET" });
//   const data = await response.json();
//   return data;
// };

// Para traer todos los productos con paginación:
export const fetchProducts = async (page: string, limit: string) => {
  const queryParams = new URLSearchParams({ page, limit }).toString();

  const response = await fetch(`${URI_PRODUCT}?${queryParams}`, { method: "GET" });
  const data = await response.json();
  return data;
};

export const getProductsByCategory = async (id: string) => {

  try {
    const response = await fetch(`${URI_PRODUCT_BY_CATEGORY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "categoryIds": [id],
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
//función usada para validar un código en el form
export const getProductByCode = async (code: number) => {
  try {
    const response = await fetch(`${URI_PRODUCT}/by-code/${code}`, {
      method: "GET",
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json(); 
    return { ok: true, data };
  } catch (error) {
    console.error("Error en getProductByCode:", error);
    return { ok: false, status: 500, error: "Error al conectar con el servidor" };
  }
};
