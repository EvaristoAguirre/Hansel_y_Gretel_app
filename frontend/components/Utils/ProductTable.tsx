import React from "react";
import { Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { IRowData } from "../Interfaces/IGridMUI";

interface ProductTableProps {
  rows: IRowData[];
  columns: GridColDef[];
  height?: number;
}
const DataGridComponent: React.FC<ProductTableProps> = ({ rows, columns, height = 450 }) => {
  return (
    <Box sx={{ height, mt: 2 }}>
      <DataGrid
        rows={rows}
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
    </Box>
  );
};

export default DataGridComponent;
