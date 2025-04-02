
import { FieldUnitType } from "@/components/Enums/unitOfMeasure";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { URI_UNIT_OF_MEASURE } from "@/components/URI/URI";

export const fetchUnits = async (token: string, page: string, limit: string) => {
  const queryParams = new URLSearchParams({ page, limit }).toString();
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/all?${queryParams}`, {

    method: "GET",
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data;
};

export const fetchUnitsNoConventional = async (token: string) => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/not-conventional`, {
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


export const searchUnits = async (
  searchTerm: string,
  token: string,
  field: FieldUnitType.NAME | FieldUnitType.ABBREVIATION = FieldUnitType.NAME
) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append(field, searchTerm);

    const response = await fetch(
      `${URI_UNIT_OF_MEASURE}/search?${queryParams.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error fetching searched units:", error);
    return [];
  }
};


