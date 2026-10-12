import { URI_CATEGORY } from "@/components/URI/URI";
import { readJson } from "@/lib/apiClient";


export const fetchCategories = async (token: string) => {
  try {
    const response = await fetch(URI_CATEGORY, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    const data = await readJson<unknown>(response);
    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error(error);
  }
}

export const createCategory = async (name: string, token: string) => {
  try {
    const response = await fetch(URI_CATEGORY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name }),

    });

    return await readJson(response);
  } catch (error) {
    console.error(error);
  }

}

export const editCategory = async (selectedCategoryId: string, name: string, token: string) => {
  try {
    const response = await fetch(`${URI_CATEGORY}/${selectedCategoryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name: name }),
    });

    return await readJson(response);
  } catch (error) {
    console.error(error);
  }
}

export const deleteCategory = async (id: string, token: string) => {
  try {
    const response = await fetch(`${URI_CATEGORY}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(error);
  }
}
export const fetchCategoriesByName = async (token: string, name: string) => {
  try {
    const response = await fetch(`${URI_CATEGORY}/by-name/${name}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const data = await readJson(response);
    return { ok: true, data };
  } catch (error) {
    console.error(error);
  }
}
