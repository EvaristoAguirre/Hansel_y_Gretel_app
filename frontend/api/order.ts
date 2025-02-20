import { URI_ORDER } from "@/components/URI/URI";

export const orderToPending = async (id: string) => {
  const response = await fetch(`${URI_ORDER}/pending/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const orderToClosed = async (id: string) => {
  const response = await fetch(`${URI_ORDER}/close/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};