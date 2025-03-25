
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { URI_UNIT_OF_MEASURE } from "@/components/URI/URI";

export const fetchUnits = async (token: string) => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/all`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const allUnitsConventional = async (token: string) => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/conventional`, {
    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const createUnit = async (form: IUnitOfMeasureForm, token: string) => {
  const response = await fetch(URI_UNIT_OF_MEASURE, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const editUnit = async (form: IUnitOfMeasureForm, token: string) => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/${form.id}`, {
    method: "PATCH",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const deleteUnit = async (id: string, token: string) => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/${id}`, {
    method: "DELETE",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
  });
  if (response.status === 200) {
    return true;
  } else {
    return false;
  }

};




