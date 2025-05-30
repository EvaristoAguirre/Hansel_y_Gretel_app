import { useState, useEffect } from "react";
import { validateTableByName } from "@/api/tables";

export const useNameTableForm = (token: string | null, initialName = "") => {
  const [nameTable, setNameTable] = useState(initialName);
  const [errorNameTable, setErrorNameTable] = useState("");

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!token) return;
      if (nameTable === "") {
        setErrorNameTable("");
        return;
      }
      const res = await validateTableByName(nameTable, token);
      if (!res.ok && res.status === 200) {
        setErrorNameTable("Este nombre ya está en uso.");
      } else {
        setErrorNameTable("");
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [nameTable, token]);

  return {
    nameTable,
    setNameTable,
    errorNameTable,
  };
};
