import { fetchCategoriesByName } from "@/api/categories";

export const validateCategoryName = async (name: string, token: string): Promise<string> => {
  if (!name.trim()) return "El nombre no puede estar vacío.";
  const res = await fetchCategoriesByName(token, name);
  if (res?.ok && res.data.name) return "Este nombre ya está en uso.";
  return "";
};