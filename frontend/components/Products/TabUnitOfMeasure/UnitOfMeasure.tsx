import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { useUnitContext } from "@/app/context/unitOfMeasureContext";
import { FormType } from "@/components/Enums/Ingredients";
import { IUnitOfMeasure, IUnitOfMeasureStandard } from "@/components/Interfaces/IUnitOfMeasure";
import DataGridComponent from "@/components/Utils/ProductTable";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";
import { Box } from "@mui/system";
import { GridCellParams } from "@mui/x-data-grid";
import { FormUnit } from "./FormUnit";

const UnitOfMeasure = () => {
  const {
    units,
    formUnit,
    setFormUnit,
    formTypeUnit,
    setFormTypeUnit,
    setFormOpenUnit,
    handleDeleteUnit,
    handleCreateUnit,
    handleEditUnit,
    handleCloseFormUnit,
    formOpenUnit,

  } = useUnitContext();

  const columns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "abbreviation", headerName: "Abreviatura", width: 100 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <div>
          <Button
            variant="contained"
            className="bg-[--color-primary] text-bold mt-2 mr-2"
            size="small"
            onClick={() => {
              setFormUnit({
                name: params.row.name,
                abbreviation: params.row.abbreviation,
                equivalenceToBaseUnit: params.row.equivalenceToBaseUnit,
                baseUnitId: params.row.baseUnitId,

              });
              setFormTypeUnit(FormType.EDIT);
              setFormOpenUnit(true);
            }}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            className="bg-[--color-primary] text-bold mt-2 p-1"
            variant="contained"
            size="small"
            onClick={() => handleDeleteUnit(params.row.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      ),
    },
  ];
  const handleOpenCreateModal = () => {
    setFormTypeUnit(FormType.CREATE);
    setFormOpenUnit(true);
  }
  return (
    <Box sx={{ m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        {/* Botón para crear una nueva unidad de medida */}
        <Button
          variant="contained"
          color="primary"
          sx={{ marginRight: 2, width: '25%', height: '56px' }}
          onClick={() => {
            handleOpenCreateModal();
          }}
        >
          + Nueva unidad
        </Button>
      </Box>
      {/* Tabla de productos */}
      <DataGridComponent rows={units} columns={columns} />

      {/* Form para crear/editar Ingrediente */}
      {formOpenUnit && (
        <FormUnit
          formType={formTypeUnit}
          onSave={formTypeUnit === FormType.CREATE ? handleCreateUnit : handleEditUnit}
        />
      )}
    </Box>
  )
}

export default UnitOfMeasure;