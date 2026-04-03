import { paymentMethod } from "@/components/Enums/dailyCash";
import { IOrderDetails, IOrderTranfer } from "@/components/Interfaces/IOrder";
import { URI_COMANDA, URI_ORDER, URI_TICKET } from "@/components/URI/URI";

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

export const reprintComanda = async (
  orderId: string,
  token: string
): Promise<string> => {
  const response = await fetch(`${URI_COMANDA}/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Error al reimprimir comanda:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.text();
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

interface PaymentDTO {
  amount: number;
  methodOfPayment: paymentMethod;
}

export const orderToClosed = async (
  orderId: string,
  token: string,
  payments: PaymentDTO[],
  commandNumber?: string,
  discountPercent: number = 0
) => {
  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  const body = {
    total,
    payments,
    discountPercent: Math.min(100, Math.max(0, Math.round(discountPercent))),
    ...(commandNumber && { commandNumber }),
  };

  const response = await fetch(`${URI_ORDER}/close/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const error = new Error(errorData.message || "Error al cerrar la orden") as any;
    error.statusCode = errorData.statusCode || response.status;
    throw error;
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

export const cancelOrderDetail = async (
  orderId: string,
  detailId: string,
  quantityToCancel: number,
  token: string
) => {
  const response = await fetch(
    `${URI_ORDER}/${orderId}/detail/${detailId}/cancel`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantityToCancel }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.message || `Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return await response.json();
};

export const transferOrder = async (token: string, data: IOrderTranfer) => {
  const dataBody = {
    fromTableId: data.fromTableId,
    toTableId: data.toTableId
  }
  const response = await fetch(`${URI_ORDER}/transfer-order/${data.id}`, {

    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },

    body: JSON.stringify(dataBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
}; 