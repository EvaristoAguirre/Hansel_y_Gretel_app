import React from "react";
import { DataGrid} from "@mui/x-data-grid";
import { Button, Box } from "@mui/material";
import { ProductTableProps } from "../Interfaces/IProducts";


export const ProductTable: React.FC<ProductTableProps> = ({ rows, columns, onCreate }) => (
  <Box>
    <Button variant="contained" className="bg-[--color-primary] text-bold" sx={{ mb: 2 }} onClick={onCreate}>
      + Nuevo
    </Button>
    <Box sx={{ height: 400 }}>
      <DataGrid rows={rows} columns={columns} />
    </Box>
  </Box>
);
