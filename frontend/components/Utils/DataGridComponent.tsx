import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { esES } from '@mui/x-data-grid/locales';
import { IRowData } from '../Interfaces/IGridMUI';
import { capitalizeFirstLetterTable } from './CapitalizeFirstLetter';

interface DataGridComponentProps {
  rows: IRowData[];
  columns: GridColDef[];
  height?: number;
  capitalize: string[];
  bgColor?: string;
}
const EMPTY_CAPITALIZE: string[] = [];

const DataGridComponent: React.FC<DataGridComponentProps> = ({
  rows,
  columns,
  capitalize = EMPTY_CAPITALIZE,
  bgColor = '#fff',
}) => {
  const displayRows = useMemo(
    () => capitalizeFirstLetterTable(rows, capitalize),
    [rows, capitalize],
  );

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      <DataGrid
        rows={displayRows}
        columns={columns}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 15 },
          },
          sorting: {
            sortModel: [{ field: 'name', sort: 'asc' }],
          },
        }}
        pageSizeOptions={[2, 5, 7, 9, 15]}
        sx={{
          backgroundColor: bgColor,
          border: 'none',
        }}
      />
    </Box>
  );
};

export default DataGridComponent;
