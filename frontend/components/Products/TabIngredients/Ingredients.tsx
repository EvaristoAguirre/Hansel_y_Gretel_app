import { fetchUnits } from "@/api/unitOfMeasure";
import { useAuth } from "@/app/context/authContext";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { FormType } from "@/components/Enums/Ingredients";
import { IUnitOfMeasureResponse } from "@/components/Interfaces/IUnitOfMeasure";
import LoadingLottie from "@/components/Loader/Loading";
import DataGridComponent from "@/components/Utils/ProductTable";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";
import { Box } from "@mui/system";
import { GridCellParams } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
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

  const { getAccessToken } = useAuth();

  const [units, setUnits] = useState<IUnitOfMeasureResponse[]>([]);


  useEffect(() => {

    const fetchAllUnits = async () => {
      try {
        const token = getAccessToken();
        if (!token) return;
        const response = await fetchUnits(token);
        setUnits(response);

      } catch (error) {
        console.error("Error al obtener las unidades de medida:", error);
      }
    };

    fetchAllUnits();

  }, []);

  const columns = [
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "description", headerName: "Descripción", width: 300 },
    { field: "cost", headerName: "Costo", width: 100 },
    {
      field: "unitOfMeasure",
      headerName: "Unidad",
      width: 100,
      renderCell: (params: GridCellParams) => {
        return params.row?.unitOfMeasure?.name || "Sin unidad de medida";
      },
    },
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
                cost: params.row.cost,
                unitOfMeasureId: params.row.unitOfMeasure
              });
              setFormType(FormType.EDIT);
              setFormOpen(true);
            }}
            disabled={units.length === 0}
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
          disabled={units.length === 0}
        >
          {units.length === 0 ? <LoadingLottie /> : '+ Nuevo Ingrediente'}
        </Button>
      </Box>
      {/* Tabla de productos */}
      <DataGridComponent rows={ingredients} columns={columns} capitalize={['name', 'description']} />

      {/* Form para crear/editar Ingrediente */}
      {formOpen && (
        <FormIngredient
          units={units}
          formType={formType}
          onSave={formType === FormType.CREATE ? handleCreateIngredient : handleEditIngredient}
        />
      )}

    </Box>
  )
}

export default Ingredients;