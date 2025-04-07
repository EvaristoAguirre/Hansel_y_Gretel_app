
import { Iingredient } from "@/components/Interfaces/Ingredients";
import { URI_INGREDIENT, URI_PRODUCT } from "@/components/URI/URI";



export const fetchIngredients = async (token: string) => {
  const response = await fetch(`${URI_INGREDIENT}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const createIngredient = async (form: Iingredient, token: string) => {
  const response = await fetch(URI_INGREDIENT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const editIngredient = async (form: Iingredient, token: string) => {
  const response = await fetch(`${URI_INGREDIENT}/${form.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const deleteIngredient = async (id: string, token: string) => {
  const response = await fetch(`${URI_INGREDIENT}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    return true;
  } else {
    return false;
  }

};

export const ingredientsById = async (id: string, token: string) => {
  const response = await fetch(`${URI_INGREDIENT}/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};


export const ingredientsByName = async (name: string, token: string,) => {

  const queryParams = new URLSearchParams({
    name: name,
  });

  try {
    const response = await fetch(`${URI_INGREDIENT}/by-name?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error(error);
  }
}

