import { MesaForm, MesaInterface } from "@/components/Interfaces/Cafe_interfaces";
import { URI_TABLE } from "@/components/URI/URI";


export const validateTableByNumber = async (number: number, token: string) => {
  try {
    const response = await fetch(`${URI_TABLE}/by-number/${number}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      // La mesa existe
      const data = await response.json();
      return { ok: false, status: 200, message: "El número de mesa ya está en uso", table: data };
    } else if (response.status === 404) {
      // La mesa no existe, está disponible para usar
      return { ok: true, status: 404, message: "Número de mesa disponible" };
    } else {
      // Error inesperado
      return { ok: false, status: response.status, message: "Error al validar el número" };
    }
  } catch (error) {
    console.error("❌ Error fetching searched tables:", error);
    return { ok: false, status: 500, message: "Error al conectar con el servidor" };
  }
};


export const validateTableByName = async (name: string, token: string) => {
  try {
    const response = await fetch(`${URI_TABLE}/by-name/${name}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      // La mesa con ese nombre ya existe
      const data = await response.json();
      return { ok: false, status: 200, message: "El nombre de mesa ya está en uso", table: data };
    } else if (response.status === 404) {
      // La mesa no existe, está disponible para usar
      return { ok: true, status: 404, message: "Nombre de mesa disponible" };
    } else {
      // Error inesperado
      return { ok: false, status: response.status, message: "Error al validar el nombre" };
    }
  } catch (error) {
    console.error("❌ Error fetching table by name:", error);
    return { ok: false, status: 500, message: "Error al conectar con el servidor" };
  }
};

export const tableToOpen = async (id: string, token: string) => {
  const response = await fetch(`${URI_TABLE}/close/${id}`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};


export const editTable = async (id: string, data: MesaForm, token: string) => {
  const response = await fetch(`${URI_TABLE}/${id}`, {
    method: "PATCH",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ ...data }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}
