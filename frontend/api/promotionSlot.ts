import { URI_PROMOTION_SLOT } from "@/components/URI/URI";
import { SlotForm } from "@/components/Interfaces/IProducts";

export interface CreateSlotPayload {
  name: string;
  description: string;
  productIds: string[]; // IDs de los productos
}

export const createPromotionSlot = async (
  form: SlotForm,
  token: string
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  const payload: CreateSlotPayload = {
    name: form.name,
    description: form.description,
    productIds: form.products.map((product) => product.id),
  };

  try {
    const response = await fetch(URI_PROMOTION_SLOT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        ok: false,
        error:
          errorData.message ||
          `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error en createPromotionSlot:", error);
    return {
      ok: false,
      error: "Error al conectar con el servidor",
    };
  }
};

export const getPromotionSlots = async (
  token: string
): Promise<{ ok: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await fetch(URI_PROMOTION_SLOT, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        ok: false,
        error:
          errorData.message ||
          `Error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error en getPromotionSlots:", error);
    return {
      ok: false,
      error: "Error al conectar con el servidor",
    };
  }
};
