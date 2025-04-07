import { useMemo } from "react";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { useUnitContext } from "@/app/context/unitOfMeasureContext";
import { FormType } from "@/components/Enums/Ingredients";
import LoadingLottie from "@/components/Loader/Loading";
import DataGridComponent from "@/components/Utils/ProductTable";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Box } from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import { FormIngredient } from "./FormIngredient";

const Ingredients = () => {
  const {
    formType,
    formOpen,
    ingredients,
    setFormIngredients,
    setFormType,
    setFormOpen,
    handleDeleteIngredient,
    handleCreateIngredient,
    handleEditIngredient
  } = useIngredientsContext();

  const { units } = useUnitContext();

  const openForm = (type: FormType, data?: any) => {
    setFormType(type);
    if (data) setFormIngredients(data);
    setFormOpen(true);
  };

  const columns = useMemo(() => [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    { field: "cost", headerName: "Costo", width: 100 },
    {
      field: "unitOfMeasure",
      headerName: "Unidad",
      width: 100,
      renderCell: (params: GridCellParams) =>
        params.row?.unitOfMeasure?.name || "Sin unidad de medida",
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: ({ row }: GridCellParams) => (
        <Box display="flex" gap={1} mt={1}>
          <Button
            variant="contained"
            className="bg-[--color-primary]"
            size="small"
            onClick={() =>
              openForm(FormType.EDIT, {
                id: row.id,
                name: row.name,
                description: row.description,
                cost: row.cost,
                unitOfMeasureId: row.unitOfMeasure,
              })
            }
            disabled={units.length === 0}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            variant="contained"
            className="bg-[--color-primary]"
            size="small"
            onClick={() => handleDeleteIngredient(row.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </Box>
      ),
    },
  ], [units]);

  return (
    <Box sx={{ m: 2, minHeight: "100vh" }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Button
          variant="contained"
          color="primary"
          sx={{ width: "25%", height: 56 }}
          onClick={() => openForm(FormType.CREATE)}
          disabled={units.length === 0}
        >
          + Nuevo Ingrediente
        </Button>
      </Box>

      <DataGridComponent
        rows={ingredients}
        columns={columns}
        capitalize={["name", "description"]}
      />

      {formOpen && (
        <FormIngredient
          units={units}
          formType={formType}
          onSave={formType === FormType.CREATE ? handleCreateIngredient : handleEditIngredient}
        />
      )}
    </Box>
  );
};

export default Ingredients;
