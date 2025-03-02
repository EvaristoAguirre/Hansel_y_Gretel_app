
import { Iingredient } from "@/components/Interfaces/Ingredients";
import { URI_INGREDIENT, URI_PRODUCT } from "@/components/URI/URI";

export const fetchIngredients = async () => {
  const response = await fetch(`${URI_INGREDIENT}`, { method: "GET" });
  const data = await response.json();
  return data;
};

export const createIngredient = async (form: Iingredient) => {
  const response = await fetch(URI_INGREDIENT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const editIngredient = async (form: Iingredient) => {
  const response = await fetch(`${URI_INGREDIENT}/${form.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const deleteIngredient = async (id: string) => {
  const response = await fetch(`${URI_INGREDIENT}/${id}`, { method: "DELETE" });
  if (response.status === 200) {
    return true;
  } else {
    return false;
  }

};




