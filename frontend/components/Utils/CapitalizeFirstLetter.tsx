import { GridValidRowModel } from "@mui/x-data-grid";

export function capitalizeFirstLetter(text?: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
export const capitalizeFirstLetterTable = (rows: readonly GridValidRowModel[], fields: string[]) => {

  return rows.map((row) => {
    const newRow = { ...row };
    if (!Array.isArray(fields)) return rows;

    fields.forEach((field) => {
      if (!newRow[field]) return;
      newRow[field] = capitalizeFirstLetter(newRow[field]);
    });
    return newRow;
  });
};