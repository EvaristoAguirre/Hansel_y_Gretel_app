
import { Iingredient } from "@/components/Interfaces/Ingredients";
import { IUnitOfMeasure } from "@/components/Interfaces/IUnitOfMeasure";
import { URI_UNIT_OF_MEASURE } from "@/components/URI/URI";

export const fetchUnits = async () => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/all`, { method: "GET" });
  const data = await response.json();
  return data;
};

export const createUnit = async (form: IUnitOfMeasure) => {
  const response = await fetch(URI_UNIT_OF_MEASURE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const editUnit = async (form: IUnitOfMeasure) => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/${form.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  return await response.json();
};

export const deleteUnit = async (id: string) => {
  const response = await fetch(`${URI_UNIT_OF_MEASURE}/${id}`, { method: "DELETE" });
  if (response.status === 200) {
    return true;
  } else {
    return false;
  }

};




