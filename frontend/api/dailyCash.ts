import { I_DC_Open } from "@/components/Interfaces/IDailyCash";
import { URI_DAILY_CASH } from "@/components/URI/URI";

export const openDailyCash = async (data: I_DC_Open, token: string) => {
  const response = await fetch(`${URI_DAILY_CASH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};
