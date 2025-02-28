import { URI_TABLE } from "@/components/URI/URI";

export const validateTableByNumber = async (number: number) => {
  try {
    const response = await fetch(`${URI_TABLE}/by-number/${number}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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


export const validateTableByName = async (name: string) => {
  try {
    const response = await fetch(`${URI_TABLE}/by-name/${name}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
