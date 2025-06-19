import { ICashMovement } from "@/components/Interfaces/IDailyCash";
import { IRowData } from "@/components/Interfaces/IGridMUI";
import DataGridComponent from "@/components/Utils/DataGridComponent";
import { GridColDef } from "@mui/x-data-grid";

// todo hardcodeado por ahora, 
// próximas tareas, se mostrarán los movimientos de la caja reales

const dummyData: IRowData[] = [
  {
    id: "1",
    fecha: "12/05/2025",
    ingresos: 100,
    egresos: 50,
    ganancia: 50,
    estado: "Abierta",
  },
];

const columns: GridColDef[] = [
  { field: "fecha", headerName: "Fecha", flex: 1 },
  {
    field: "ingresos",
    headerName: "Ingresos",
    flex: 1,
    renderCell: (params) => <span style={{ color: "green" }}>${params.value.toFixed(2)}</span>,
  },
  {
    field: "egresos",
    headerName: "Egresos",
    flex: 1,
    renderCell: (params) => <span style={{ color: "red" }}>${params.value.toFixed(2)}</span>,
  },
  {
    field: "ganancia",
    headerName: "Ganancia",
    flex: 1,
    renderCell: (params) => <span style={{ color: "purple" }}>${params.value.toFixed(2)}</span>,
  },
  {
    field: "estado",
    headerName: "Estado de Caja",
    flex: 1,
    renderCell: (params) => (
      <span style={{ backgroundColor: params.value === "Abierta" ? "#d0f0c0" : "#eee", padding: '4px 8px', borderRadius: 4 }}>
        {params.value}
      </span>
    ),
  },
  {
    field: "acciones",
    headerName: "Acciones",
    flex: 1,
    sortable: false,
    renderCell: () => (
      <button style={{ fontSize: 12, padding: "4px 8px", cursor: "pointer" }}>Ver</button>
    ),
  },
];

const CashTable = () => {
  return (
    <DataGridComponent
      rows={dummyData}
      columns={columns}
      capitalize={[]}
    />
  );
};

export default CashTable;
