import {
  INewMovement,
  IDailyCash,
  I_DC_Open_Close,
} from '@/components/Interfaces/IDailyCash';
import { URI_DAILY_CASH, URI_ORDER } from '@/components/URI/URI';

export const fetchDailyCashResume = async (token: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const fetchAllDailyCash = async (token: string) => {
  try {
    const response = await fetch(`${URI_DAILY_CASH}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // ✅ Mejorar el logging para ver exactamente qué devuelve el backend
      let errorData: any = {};
      let responseText = '';

      try {
        responseText = await response.text();
        errorData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        console.error('Response text that failed to parse:', responseText);
        errorData = {
          message: `Error ${response.status}: ${response.statusText}`,
          rawResponse: responseText, // ✅ Incluir respuesta cruda para debug
        };
      }

      console.error('Error fetching daily cash:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()), // ✅ Ver headers
        error: errorData,
        responseText: responseText, // ✅ Ver texto completo
      });
      return []; // Devolver array vacío en caso de error
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // ✅ Capturar errores de red u otros errores inesperados
    console.error('Network error fetching daily cash:', error);
    return [];
  }
};

export const fetchDailyCashByID = async (token: string, id: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const openDailyCash = async (token: string, data: I_DC_Open_Close) => {
  const response = await fetch(`${URI_DAILY_CASH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error:', errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const closeDailyCash = async (
  token: string,
  id: string,
  data: I_DC_Open_Close
) => {
  const response = await fetch(`${URI_DAILY_CASH}/close/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error:', errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const editDailyCash = async (
  token: string,
  id: string,
  data: IDailyCash
) => {
  const response = await fetch(`${URI_DAILY_CASH}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error:', errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const deleteDailyCash = async (token: string, id: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    return true;
  } else {
    return false;
  }
};

export const checkOpenDailyCash = async (token: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/check-open`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const newMovement = async (token: string, body: INewMovement) => {
  const response = await fetch(`${URI_DAILY_CASH}/register-movement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error:', errorData);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const getMovements = async (
  token: string,
  day: number,
  month: number,
  year: number
) => {
  const response = await fetch(
    `${URI_DAILY_CASH}/movements/by-date?day=${day}&month=${month}&year=${year}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
};

export const getMovementsDetailsById = async (token: string, id: string) => {
  const response = await fetch(`${URI_DAILY_CASH}/movement-by-id/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const getOrderDetails = async (token: string, id: string) => {
  const response = await fetch(`${URI_ORDER}/order-by-id/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};
