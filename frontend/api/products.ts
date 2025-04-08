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

    if (response.status === 404) {
      return [];
    }
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
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

export const getProductByName = async (name: string, token: string) => {

  const queryParams = new URLSearchParams({
    name: name,
  });

  try {
    const response = await fetch(`${URI_PRODUCT}/by-name?${queryParams.toString()}`, {
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


    return data;
  } catch (error) {

    console.error("❌ Error fetching searched products:", error);
    return [];
  }
};


export const searchProductsNotProm = async (searchTerm: string, token: string, selectedCategoryId?: string | null) => {
  try {
    const isNumeric = !isNaN(Number(searchTerm));
    const queryParams = new URLSearchParams({
      [isNumeric ? "code" : "name"]: searchTerm,
      limit: "100",
    });

    const response = await fetch(`${URI_PRODUCT}/prod-to-prom?${queryParams.toString()}`, {
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


    return data;
  } catch (error) {

    console.error("❌ Error fetching searched products:", error);
    return [];
  }
};
