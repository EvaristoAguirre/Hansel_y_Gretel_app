import { GridValidRowModel } from "@mui/x-data-grid";

export function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
export const capitalizeFirstLetterTable = (rows: readonly GridValidRowModel[], fields: string[]) => {
  console.log("Array de fields🦋", fields);
  console.log("rows🌳", rows);

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