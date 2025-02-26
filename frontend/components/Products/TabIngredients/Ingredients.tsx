import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { FormType } from "@/components/Enums/Ingredients";
import DataGridComponent from "@/components/Utils/ProductTable";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";
import { Box } from "@mui/system";
import { GridCellParams } from "@mui/x-data-grid";

const Ingredients = () => {
  const { formIngredients, setFormIngredients, setFormType, setFormOpen, handleDelete } = useIngredientsContext();
  const ingredients = [
    {
      id: 1,
      name: "Ingredient 1",
      description: "Description 1",
      price: 10.99,
    },
    {
      id: 2,
      name: "Ingredient 2",
      description: "Description 2",
      price: 19.99,
    }
  ]
  const columns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    { field: "price", headerName: "Precio", width: 100 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: (params: GridCellParams) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <Button
            variant="contained"
            className="bg-[--color-primary] text-bold mt-2"
            size="small"
            onClick={() => {
              setFormIngredients({
                id: params.row.id,
                name: params.row.name,
                description: params.row.description,
                price: params.row.price,
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
            onClick={() => handleDelete(params.row.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      ),
    },
  ];
  return (
    <Box sx={{ m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        {/* Botón para crear nuevo Ingrediente */}
        <Button
          variant="contained"
          color="primary"
          sx={{ marginRight: 2, width: '25%', height: '56px' }}
        >
          + Nuevo
        </Button>
      </Box>
      {/* Tabla de productos */}
      <DataGridComponent rows={ingredients} columns={columns} />
    </Box>
  )
}

export default Ingredients;