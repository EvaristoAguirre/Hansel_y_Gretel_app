import { GridValidRowModel } from "@mui/x-data-grid";

export function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// export function capitalizeFirstLetterTable(data: any[], fieldsToCapitalize: string[]): any[] {
//   return data.map(item => {
//     fieldsToCapitalize.forEach(field => {
//       if (item[field] && typeof item[field] === 'string') {
//         item[field] = item[field].charAt(0).toUpperCase() + item[field].slice(1);
//       }
//     });
//     return item;
//   });
// }

export const capitalizeFirstLetterTable = (rows: readonly GridValidRowModel[], fields: string[]) => {
  return rows.map((row) => {
    const newRow = { ...row };
    fields.forEach((field) => {
      if (!newRow[field]) return;
      newRow[field] = capitalizeFirstLetter(newRow[field]);
    });
    return newRow;
  });
};