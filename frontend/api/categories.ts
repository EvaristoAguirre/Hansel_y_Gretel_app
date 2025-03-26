import { URI_CATEGORY } from "@/components/URI/URI";


export const fetchCategories = async (token: string) => {
  try {
    const response = await fetch(URI_CATEGORY, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return Array.isArray(data) ? data : [];

  } catch (error) {
    console.error(error);
  }
}
