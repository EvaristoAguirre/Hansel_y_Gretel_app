import { useUnitContext } from "@/app/context/unitOfMeasureContext";
import { FormType } from "@/components/Enums/Ingredients";
import LoadingLottie from "@/components/Loader/Loading";
import DataGridComponent from "@/components/Utils/ProductTable";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { GridCellParams } from "@mui/x-data-grid";
import { Suspense } from "react";
import { FormUnit } from "./FormUnit";

const UnitOfMeasure = () => {
  const {
    conventionalUnits,
    noConventionalUnits,
    setFormUnit,
    formTypeUnit,
    setFormTypeUnit,
    setFormOpenUnit,
    handleDeleteUnit,
    handleCreateUnit,
    handleEditUnit,
    formOpenUnit,

  } = useUnitContext();

  const columns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "abbreviation", headerName: "Abreviatura", width: 100 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 250,
      renderCell: (params: GridCellParams) => (
        <div className="flex justify-center gap-2 align-center mt-3">
          <Button
            variant="contained"
            className="bg-[--color-primary] text-bold mt-2 mr-2"
            size="small"
            onClick={() => {
              setFormUnit({
                name: params.row.name,
                abbreviation: params.row.abbreviation,
                conversions: params.row.conversions
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
  ]; const columnsConventional = [
    { field: "name", headerName: "Nombre" },
    { field: "abbreviation", headerName: "Abreviatura" },
  ];
  const handleOpenCreateModal = () => {
    setFormTypeUnit(FormType.CREATE);
    setFormOpenUnit(true);
  }
  return (
    <Suspense fallback={<LoadingLottie />}>
      <Box sx={{ m: 2, minHeight: '80vh' }}>
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

        <Box sx={{ display: 'flex', mb: 2, gap: 6, mt: 2 }}>
          <div className="w-1/2" style={{ display: 'flex', flexDirection: 'column' }}
          >
            <Typography variant="h4" color={"primary"}>Unidades de medida personalizadas</Typography>
            <DataGridComponent rows={noConventionalUnits} columns={columns} capitalize={["name", "abbreviation"]} />
          </div>

          <div className="w-1/2" style={{ display: 'flex', flexDirection: 'column' }}
          >
            <Typography variant="h4" color={"primary"}>Unidades de medida convencionales/fijas</Typography>
            <DataGridComponent rows={conventionalUnits} columns={columnsConventional} capitalize={["name", "abbreviation"]} />
          </div>

        </Box>

        {formOpenUnit && (
          <FormUnit
            formType={formTypeUnit}
            onSave={formTypeUnit === FormType.CREATE ? handleCreateUnit : handleEditUnit}
          />
        )}
      </Box>
    </Suspense>
  )
}

export default UnitOfMeasure;