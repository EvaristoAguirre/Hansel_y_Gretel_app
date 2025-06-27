import React from "react";
import { Box } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { esES } from "@mui/x-data-grid/locales";
import { IRowData } from "../Interfaces/IGridMUI";
import { capitalizeFirstLetterTable } from "./CapitalizeFirstLetter";

interface DataGridComponentProps {
  rows: IRowData[];
  columns: GridColDef[];
  height?: number;
  capitalize: string[];
  bgColor?: string;
}
const DataGridComponent: React.FC<DataGridComponentProps> = ({
  rows,
  columns,
  capitalize = [],
  bgColor = "#fff",
}) => {


  return (

    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>

      <DataGrid
        rows={capitalizeFirstLetterTable(rows, capitalize)}
        columns={columns}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        initialState={{
          pagination: {
            paginationModel: { page: 1, pageSize: 15 },
          },
          sorting: {
            sortModel: [{ field: "name", sort: "asc" }],
          },
        }}
        pageSizeOptions={[2, 5, 7, 9, 15]}
        sx={{
          backgroundColor: bgColor,
          border: "none",
        }}
      />

    </Box>
  );
};

export default DataGridComponent;
