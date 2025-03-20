import { URI_PRODUCT, URI_PRODUCT_BY_CATEGORY } from "@/components/URI/URI";
import { ProductCreated, ProductForm } from '../components/Interfaces/IProducts';


export const createProduct = async (form: ProductForm, token: string) => {
  const response = await fetch(URI_PRODUCT, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const editProduct = async (form: ProductForm, token: string) => {
  const response = await fetch(`${URI_PRODUCT}/${form.id}`, {
    method: "PUT",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
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
export const fetchProducts = async (page: string, limit: string, token: string) => {
  const queryParams = new URLSearchParams({ page, limit }).toString();

  const response = await fetch(`${URI_PRODUCT}?${queryParams}`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const getProductsByCategory = async (id: string, token: string) => {
  try {
    const response = await fetch(`${URI_PRODUCT_BY_CATEGORY}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ categories: [id] }),
    });

    // if (!response.ok) {
    //   // Manejo de errores según el status code
    //   return { ok: false, status: response.status, message: await response.text() };
    // }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error en getProductsByCategory:", error);
    return { ok: false, message: "Error de conexión con el servidor" };
  }
};

//función usada para validar un código en el form
export const getProductByCode = async (code: number, token: string) => {
  try {
    const response = await fetch(`${URI_PRODUCT}/by-code/${code}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },

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
export const searchProducts = async (searchTerm: string, token: string, selectedCategoryId?: string | null) => {
  try {
    // Detectamos si es un número
    const isNumeric = !isNaN(Number(searchTerm));

    const queryParams = new URLSearchParams({
      [isNumeric ? "code" : "name"]: searchTerm,
      limit: "10",
    });

    const response = await fetch(`${URI_PRODUCT}/search?${queryParams.toString()}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ "categories": [selectedCategoryId] })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    console.log("Resultados de la búsqueda en endpoint:", data);


    return data;
  } catch (error) {

    console.error("❌ Error fetching searched products:", error);
    return [];
  }
};



