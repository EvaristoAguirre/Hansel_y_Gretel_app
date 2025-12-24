import { GridValidRowModel } from '@mui/x-data-grid';

export function capitalizeFirstLetter(text?: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const capitalizeFirstLetterTable = (
  rows: readonly GridValidRowModel[],
  fields: string[]
) => {
  // Validación defensiva: si no es array, devolver array vacío
  if (!Array.isArray(rows)) {
    console.warn('capitalizeFirstLetterTable: rows is not an array', rows);
    return [];
  }

  // Validar que fields sea array
  if (!Array.isArray(fields)) {
    return rows;
  }

  return rows.map((row) => {
    const newRow = { ...row };
    fields.forEach((field) => {
      if (newRow[field]) {
        newRow[field] = capitalizeFirstLetter(String(newRow[field]));
      }
    });
    return newRow;
  });
};
