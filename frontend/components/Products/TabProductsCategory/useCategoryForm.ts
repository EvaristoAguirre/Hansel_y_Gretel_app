import { useState, useEffect } from "react";
import { fetchCategoriesByName } from "@/api/categories";

export const useCategoryForm = (token: string | null, initialName = "") => {
  const [nombre, setNombre] = useState(initialName);
  const [errorNombre, setErrorNombre] = useState("");

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!token) return;
      const res = await fetchCategoriesByName(token, nombre);
      if (res?.ok && res.data.name) {
        setErrorNombre("Este nombre ya está en uso.");
      } else {
        setErrorNombre("");
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [nombre, token]);

  return {
    nombre,
    setNombre,
    errorNombre,
  };
};
