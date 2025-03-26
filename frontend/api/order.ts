import { URI_ORDER } from "@/components/URI/URI";

export const orderToPending = async (id: string, token: string) => {
  const response = await fetch(`${URI_ORDER}/pending/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const orderToClosed = async (id: string, token: string) => {
  const response = await fetch(`${URI_ORDER}/close/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const deleteOrder = async (id: string, token: string) => {
  const response = await fetch(`${URI_ORDER}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (response.status !== 200) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  if (responseText === "Order successfully deleted") {
    return true;
  } else {
    throw new Error(`Error: ${responseText}`);
  }
};