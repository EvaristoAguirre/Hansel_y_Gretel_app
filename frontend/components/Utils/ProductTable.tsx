import React from "react";
import { Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { IRowData } from "../Interfaces/IGridMUI";
import { capitalizeFirstLetterTable } from "./CapitalizeFirstLetter";
import LoadingLottie from "../Loader/Loading";

interface ProductTableProps {
  rows: IRowData[];
  columns: GridColDef[];
  height?: number;
}
const DataGridComponent: React.FC<ProductTableProps> = ({ rows, columns, height = 450 }) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
      {
        rows.length === 0 ? (
          <LoadingLottie />
        ) :
          <DataGrid
            rows={capitalizeFirstLetterTable(rows, ['name', 'description'])}
            columns={columns}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            initialState={{
              pagination: {
                paginationModel: { page: 1, pageSize: 5 },
              },
              sorting: {
                sortModel: [{ field: "name", sort: "asc" }],
              },
            }}
            pageSizeOptions={[2, 5, 7, 9, 15]}
          />
      }
    </Box>
  );
};

export default DataGridComponent;
