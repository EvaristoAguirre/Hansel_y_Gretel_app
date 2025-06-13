import { IToppingForm } from "@/components/Interfaces/IToppings";
import { URI_TOPPINGS, URI_TOPPINGS_GROUP } from "@/components/URI/URI";

export const fetchToppings = async (token: string) => {
  const response = await fetch(`${URI_TOPPINGS}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const fetchToppingsById = async (token: string, id: string) => {
  const response = await fetch(`${URI_TOPPINGS}/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const fetchToppingsByName = async (token: string, id: string, name: string) => {

  const queryParams = new URLSearchParams({
    name: name,
  });

  const response = await fetch(`${URI_TOPPINGS}/by-name?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};
// GRUPOS DE TOPPINGS

export const createToppingGroup = async (token: string, form: IToppingForm) => {
  const response = await fetch(`${URI_TOPPINGS_GROUP}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(form),

  })
  const data = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export const editToppingGroup = async (token: string, form: IToppingForm, id: string) => {
  const response = await fetch(`${URI_TOPPINGS_GROUP}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(form),

  })
  const data = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export const deleteToppingGroup = async (token: string, id: string) => {
  const response = await fetch(`${URI_TOPPINGS_GROUP}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },

  })
  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    data: text,
  };
}
export const fetchAllToppingsGroup = async (token: string) => {
  const response = await fetch(`${URI_TOPPINGS_GROUP}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },

  })
  const data = await response.json();
  return data;
}

export const validatedNameToppingsGroup = async (name: string, token: string) => {
  try {
    const response = await fetch(`${URI_TOPPINGS_GROUP}/by-name/${encodeURIComponent(name)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { ok: false };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al validar nombre de grupo:", error);
    return { ok: false };
  }
};
