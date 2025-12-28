import { Iingredient } from '@/components/Interfaces/Ingredients';
import { URI_INGREDIENT, URI_PRODUCT } from '@/components/URI/URI';

export const fetchIngredientsAndToppings = async (token: string) => {
  const response = await fetch(`${URI_INGREDIENT}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || 'Error al obtener ingredientes y toppings'
    );
  }
  const data = await response.json();
  return data;
};

export const fetchIngredientsAll = async (token: string) => {
  const response = await fetch(`${URI_INGREDIENT}/all`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || 'Error al obtener ingredientes'
    );
  }
  const data = await response.json();
  return data;
};

export const createIngredient = async (form: Iingredient, token: string) => {
  const response = await fetch(URI_INGREDIENT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error al crear ingrediente');
  }

  return await response.json();
};

export const editIngredient = async (form: Iingredient, token: string) => {
  const response = await fetch(`${URI_INGREDIENT}/${form.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error al editar ingrediente');
  }

  return await response.json();
};

export const deleteIngredient = async (id: string, token: string) => {
  const response = await fetch(`${URI_INGREDIENT}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
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
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || 'Error al obtener ingrediente por id'
    );
  }
  const data = await response.json();
  return data;
};

export const ingredientsByName = async (name: string, token: string) => {
  const queryParams = new URLSearchParams({
    name: name,
  });

  try {
    const response = await fetch(
      `${URI_INGREDIENT}/by-name?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error(error);
  }
};
