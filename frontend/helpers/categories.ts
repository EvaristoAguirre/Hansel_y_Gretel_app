import { URI_CATEGORY, URI_PRODUCT_BY_CATEGORY } from "@/components/URI/URI";

export const fetchCategories = async () => {
  try {
    const response = await fetch(URI_CATEGORY, { method: "GET" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}

export const ProductsByCategory = async (id: string) => {

  try {
    const response = await fetch(`${URI_PRODUCT_BY_CATEGORY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "categoryIds": [id],
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}