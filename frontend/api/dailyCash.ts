import { INewMovement, I_DC_, I_DC_Open } from "@/components/Interfaces/IDailyCash";
import { URI_DAILY_CASH } from "@/components/URI/URI";

export const fetchAllDailyCash = async (token: string) => {
  const response = await fetch(`${URI_DAILY_CASH}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const fetchDailyCashByID = async (token: string, id: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const openDailyCash = async (token: string, data: I_DC_Open,) => {
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

export const closeDailyCash = async (token: string, id: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/close/${id}`, {
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

export const editDailyCash = async (token: string, id: string, data: I_DC_) => {
  const response = await fetch(`${URI_DAILY_CASH}/${id}`, {
    method: "PATCH",
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

export const deleteDailyCash = async (token: string, id: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    return true;
  } else {
    return false;
  }
};

export const newMovement = async (token: string, body: INewMovement) => {
  const response = await fetch(`${URI_DAILY_CASH}/register-movement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error:", errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};


