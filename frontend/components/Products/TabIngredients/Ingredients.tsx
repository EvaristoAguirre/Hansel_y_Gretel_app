import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { FormType } from "@/components/Enums/Ingredients";
import DataGridComponent from "@/components/Utils/ProductTable";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";
import { Box } from "@mui/system";
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

  const columns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    { field: "cost", headerName: "Costo", width: 100 },
    // { field: "unitOfMeasure", headerName: "Unidad de Medida", width: 150 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <Button
            variant="contained"
            className="bg-[--color-primary] text-bold mt-2 mr-2"
            size="small"
            onClick={() => {
              setFormIngredients({
                id: params.row.id,
                name: params.row.name,
                description: params.row.description,
                cost: params.row.cost
              });
              setFormType(FormType.EDIT);
              setFormOpen(true);
            }}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            className="bg-[--color-primary] text-bold mt-2 p-1"
            variant="contained"
            size="small"
            onClick={() => handleDeleteIngredient(params.row.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      ),
    },
  ];
  const handleOpenCreateModal = () => {
    setFormType(FormType.CREATE);
    setFormOpen(true);
  }
  return (
    <Box sx={{ m: 2, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        {/* Botón para crear nuevo Ingrediente */}
        <Button
          variant="contained"
          color="primary"
          sx={{ marginRight: 2, width: '25%', height: '56px' }}
          onClick={() => {
            handleOpenCreateModal();
          }}
        >
          + Nuevo Ingrediente
        </Button>
      </Box>
      {/* Tabla de productos */}
      <DataGridComponent rows={ingredients} columns={columns} />

      {/* Form para crear/editar Ingrediente */}
      {formOpen && (
        <FormIngredient
          formType={formType}
          onSave={formType === FormType.CREATE ? handleCreateIngredient : handleEditIngredient}
        />
      )}

    </Box>
  )
}

export default Ingredients;