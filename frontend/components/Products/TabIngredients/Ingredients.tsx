import { useMemo, useState } from "react";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { useUnitContext } from "@/app/context/unitOfMeasureContext";
import { FormType } from "@/components/Enums/ingredients";
import DataGridComponent from "@/components/Utils/DataGridComponent";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Button,
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import { GridCellParams } from "@mui/x-data-grid";
import { FormIngredient } from "./FormIngredient";
import ToppingsGroupList from "./Toppings/ToppingsGroupList";

function TabPanel({ children, value, index }: any) {
  return value === index ? <Box mt={2}>{children}</Box> : null;
}

const Ingredients = () => {
  const [tabIndex, setTabIndex] = useState(0);

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
    {
      field: "isTopping",
      headerName: "¿Es un Agregado?",
      width: 200,
      renderCell: (params: GridCellParams) =>
        params.value ? "Sí" : "No",
    },
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
                isTopping: row.isTopping
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
      <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
        <Tab label="Lista de Ingredientes" />
        <Tab label="Grupos de Agregados" />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
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
            onSave={
              formType === FormType.CREATE
                ? handleCreateIngredient
                : handleEditIngredient
            }
          />
        )}
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <ToppingsGroupList />
      </TabPanel>
    </Box>
  );
};

export default Ingredients;
