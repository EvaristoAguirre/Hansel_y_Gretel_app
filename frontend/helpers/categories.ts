import { URI_CATEGORY } from "@/components/URI/URI";

export const fetchCategories = async () => {
  try {
    const response = await fetch(URI_CATEGORY, { method: "GET" });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}

