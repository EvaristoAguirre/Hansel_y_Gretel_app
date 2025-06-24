import { PaymentMethod, paymentMethod } from "@/components/Enums/dailyCash";
import { IOrderDetails } from "@/components/Interfaces/IOrder";
import { URI_ORDER, URI_TICKET } from "@/components/URI/URI";

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

export const orderToReprint = async (id: string, token: string) => {
  const response = await fetch(`${URI_TICKET}/${id}`, {
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

export const orderToClosed = async (order: IOrderDetails, token: string, methodOfPayment: PaymentMethod) => {
  const response = await fetch(`${URI_ORDER}/close/${order.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ methodOfPayment: methodOfPayment, total: order.total }),
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

export const cancelOrder = async (id: string, token: string) => {
  const response = await fetch(`${URI_ORDER}/cancel/${id}`, {
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