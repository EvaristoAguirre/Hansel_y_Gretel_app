import React, { useEffect, useRef, useState } from "react";
import {
  DialogContent,
  TextField,
  Button,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  List,
  ListItem,
  IconButton,
  ListItemText,
  Tooltip,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { GridDeleteIcon } from "@mui/x-data-grid";
import { Iingredient, IingredientForm } from "@/components/Interfaces/Ingredients";
import { fetchUnits } from "@/api/unitOfMeasure";
import { fetchIngredients } from "@/api/ingredients";
import { Box } from "@mui/system";
import { useAuth } from "@/app/context/authContext";
import { ProductForm } from "@/components/Interfaces/IProducts";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { TabProductKey } from "@/components/Enums/view-products";

interface IngredientDialogProps {
  onSave: (ingredientsForm: IingredientForm[]) => void;
  form: ProductForm;
  units: IUnitOfMeasureForm[];
  handleSetDisableTabs: (tabKeys: TabProductKey[]) => void;
}

const IngredientDialog: React.FC<IngredientDialogProps> = ({ onSave, form, units, handleSetDisableTabs }) => {
  const { getAccessToken } = useAuth();
  const [ingredients, setIngredients] = useState<Iingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<IingredientForm[]>([]);
  const [newIngredient, setNewIngredient] = useState<IingredientForm>({
    name: "",
    ingredientId: "",
    quantityOfIngredient: 0,
    unitOfMeasureId: "",
  });

  // Estados para editar
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editIngredient, setEditIngredient] = useState<IingredientForm | null>(null);
  const [isAddButtonDisabled, setIsAddButtonDisabled] = useState(true);


  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    if (form.ingredients && form.ingredients.length > 0) {

      const preparedIngredients = form.ingredients.map((ingredient: any) => ({
        name: ingredient.name,
        ingredientId: ingredient.ingredientId,
        quantityOfIngredient: Number(ingredient?.quantityOfIngredient),
        unitOfMeasureId: ingredient.unitOfMeasureId
      }))

      setSelectedIngredients(preparedIngredients);


    }
    fetchIngredients(token).then(ings => setIngredients(ings));
  }, []);

  useEffect(() => {
    setIsAddButtonDisabled(
      !newIngredient.ingredientId ||
      !newIngredient.quantityOfIngredient ||
      newIngredient.quantityOfIngredient <= 0 ||
      !newIngredient.unitOfMeasureId
    );
  }, [newIngredient]);

  const prevIngredientsRef = useRef<IingredientForm[]>([]);

  useEffect(() => {
    if (!selectedIngredients.length) {
      handleSetDisableTabs([]);
    }
    if (JSON.stringify(prevIngredientsRef.current) !== JSON.stringify(selectedIngredients)) {
      onSave(selectedIngredients);
      prevIngredientsRef.current = selectedIngredients;
    }
  }, [selectedIngredients]);


  const handleAddIngredient = () => {
    if (
      newIngredient.ingredientId &&
      newIngredient.quantityOfIngredient &&
      newIngredient.quantityOfIngredient > 0
    ) {
      // Asignar el nombre basado en el ingredientId 
      const ingredientData = ingredients.find(ing => ing.id === newIngredient.ingredientId);
      const ingredientWithName = {
        ...newIngredient,
        name: ingredientData ? ingredientData.name : newIngredient.name,
      };
      setSelectedIngredients([...selectedIngredients, ingredientWithName]);
      handleSetDisableTabs([TabProductKey.PROMO, TabProductKey.SIMPLE_PRODUCT]);
      setNewIngredient({
        name: "",
        ingredientId: "",
        quantityOfIngredient: 0,
        unitOfMeasureId: "",
      });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const handleStartEdit = (index: number) => {
    setEditIndex(index);
    setEditIngredient({ ...selectedIngredients[index] });
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditIngredient(null);
  };

  const handleSaveEdit = () => {
    if (editIngredient !== null && editIndex !== null) {
      const updatedIngredients = [...selectedIngredients];
      updatedIngredients[editIndex] = editIngredient;
      setSelectedIngredients(updatedIngredients);
      setEditIndex(null);
      setEditIngredient(null);
    }
  };

  return (
    <>
      <DialogContent sx={{ padding: 0 }}>
        {/* Sección para agregar un nuevo ingrediente */}
        <FormControl margin="dense"
          sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, width: "100%" }}>

          <FormControl
            variant="outlined"
            sx={{ width: "40%" }}
            size="small"
          >
            <InputLabel>Ingrediente</InputLabel>
            <Select
              label="Ingrediente"
              value={newIngredient.ingredientId}
              onChange={(e) =>
                setNewIngredient({
                  ...newIngredient,
                  ingredientId: e.target.value,
                  name: e.target.name,
                })
              }
            >
              {ingredients.map((ingredient) => (
                <MenuItem key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Cantidad"
            type="number"
            margin="dense"
            value={newIngredient.quantityOfIngredient}
            onChange={(e) => {
              let value = parseFloat(e.target.value);
              if (isNaN(value) || value <= 0) return;
              setNewIngredient({ ...newIngredient, quantityOfIngredient: value });
            }}
            inputProps={{ min: 1, step: "any" }}
            sx={{ width: "25%" }}
            size="small"
          />
          <FormControl variant="outlined" sx={{ minWidth: 120, width: "45%" }} size="small">
            <InputLabel sx={{}}>Unidad de Medida</InputLabel>
            <Select
              label="Unidad de medida"
              value={newIngredient.unitOfMeasureId}
              onChange={(e) =>
                setNewIngredient({ ...newIngredient, unitOfMeasureId: e.target.value })
              }
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 200,
                    overflowY: "auto",
                  },
                },
              }}
            >
              {units.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FormControl>
        <Button
          onClick={handleAddIngredient}
          variant="contained"
          color="primary"
          sx={{ mt: 2, display: "flex", justifySelf: "end" }}
          disabled={isAddButtonDisabled}
        >
          Agregar Ingrediente
        </Button>

        {/* Lista de ingredientes agregados */}
        <List sx={{ maxHeight: 130, overflowY: 'auto' }}>
          {selectedIngredients.map((ingredient, index) => (
            <ListItem key={index} divider
              secondaryAction={
                <>
                  {editIndex === index ? (
                    <Box sx={{ display: "flex", flexDirection: "row", gap: "8px" }} >
                      <Tooltip title="Guardar">
                        <IconButton edge="end" onClick={handleSaveEdit}>
                          <SaveIcon color="success" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancelar">
                        <IconButton edge="end" onClick={handleCancelEdit}>
                          <CancelIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <div className="flex gap-2">
                      <IconButton edge="end" onClick={() => handleStartEdit(index)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleRemoveIngredient(index)}>
                        <GridDeleteIcon />
                      </IconButton>
                    </div>
                  )}
                </>
              }
            >
              {editIndex === index && editIngredient ? (
                // Modo edición para el ingrediente
                <div style={{ width: "90%", display: "flex", flexDirection: "row", gap: "8px" }}>
                  <TextField
                    sx={{ width: "40%" }}
                    margin="dense"
                    label="Nombre"
                    type="string"
                    value={editIngredient.name}
                    onChange={(e) =>
                      setEditIngredient({
                        ...editIngredient,
                        name: e.target.value,
                      })
                    }
                    size="small"
                  />
                  <TextField
                    sx={{ width: "20%" }}
                    margin="dense"
                    label="Cantidad"
                    type="number"
                    value={editIngredient.quantityOfIngredient}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value);
                      if (isNaN(value) || value <= 0) return;
                      setEditIngredient({ ...editIngredient, quantityOfIngredient: value });
                    }}
                    inputProps={{ min: 1, step: "any" }}
                    size="small"
                  />

                  <FormControl fullWidth margin="dense" size="small"
                    sx={{ width: "40%" }}>
                    <InputLabel>Unidad</InputLabel>
                    <Select
                      value={editIngredient.unitOfMeasureId}
                      onChange={(e) =>
                        setEditIngredient({
                          ...editIngredient,
                          unitOfMeasureId: e.target.value,
                        })
                      }
                      size="small"
                    >
                      {units.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              ) : (

                // Vista del ingrediente agregado

                <ListItemText

                  primary={`${ingredient.name} - ${ingredient.quantityOfIngredient} ${units.find(u => u.id === ingredient.unitOfMeasureId)?.abbreviation || ""}`}
                  sx={{ fontSize: '0.5rem' }}
                />

              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </>
  );
};

export default IngredientDialog;
