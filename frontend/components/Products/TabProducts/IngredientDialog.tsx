import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
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
  PaperProps,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { GridDeleteIcon } from "@mui/x-data-grid";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { Iingredient, IingredientForm } from "@/components/Interfaces/Ingredients";
import { fetchUnits } from "@/api/unitOfMeasure";
import { IUnitOfMeasure } from "@/components/Interfaces/IUnitOfMeasure";
import { fetchIngredients } from "@/api/ingredients";
import { Box } from "@mui/system";
import { useAuth } from "@/app/context/authContext";
import { ProductForm } from "@/components/Interfaces/IProducts";
import { Ingredient } from '../../../../backend/src/Ingredient/ingredient.entity';

interface IngredientDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (ingredientsForm: IingredientForm[]) => void;
  form: ProductForm;
}

const IngredientDialog: React.FC<IngredientDialogProps> = ({ open, onClose, onSave, form }) => {
  const { getAccessToken } = useAuth();
  const [unit, setUnit] = useState<IUnitOfMeasure[]>([]);
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

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    if (form.ingredients) {
      const preparedIngredients = form.ingredients.map((ingredient: any) => ({
        name: ingredient.ingredient.name,
        ingredientId: ingredient.ingredient.id,
        quantityOfIngredient: ingredient.quantityOfIngredient,
        unitOfMeasureId: ingredient.unitOfMeasure.id
      }))
      setSelectedIngredients(preparedIngredients);
    }
    fetchUnits(token).then(units => setUnit(units));
    fetchIngredients(token).then(ings => setIngredients(ings));
  }, []);

  const handleAddIngredient = () => {
    if (
      newIngredient.ingredientId &&
      newIngredient.quantityOfIngredient &&
      newIngredient.quantityOfIngredient > 0
    ) {
      // Asignar el nombre basado en el ingredientId (opcional)
      const ingredientData = ingredients.find(ing => ing.id === newIngredient.ingredientId);
      const ingredientWithName = {
        ...newIngredient,
        name: ingredientData ? ingredientData.name : newIngredient.name,
      };
      setSelectedIngredients([...selectedIngredients, ingredientWithName]);
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
    <Dialog open={open} onClose={onClose}  >
      <DialogTitle>Asociar Ingredientes</DialogTitle>
      <DialogContent>
        {/* Sección para agregar un nuevo ingrediente */}
        <FormControl margin="dense"
          sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, width: "100%" }}>
          <FormControl variant="outlined" sx={{ minWidth: 120, width: "40%" }}>
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
            onChange={(e) =>
              setNewIngredient({ ...newIngredient, quantityOfIngredient: +e.target.value })
            }
            sx={{ minWidth: 120, width: "15%" }}
          />
          <FormControl variant="outlined" sx={{ minWidth: 120, width: "45%" }}>
            <InputLabel sx={{ fontSize: "15px" }}>Unidad de Medida</InputLabel>
            <Select
              label="Unidad de medida"
              value={newIngredient.unitOfMeasureId}
              onChange={(e) =>
                setNewIngredient({ ...newIngredient, unitOfMeasureId: e.target.value })
              }
            >
              {unit.map((u) => (
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
        >
          Agregar Ingrediente
        </Button>

        {/* Lista de ingredientes agregados */}
        <List sx={{ mt: 2 }}>
          {selectedIngredients.map((ingredient, index) => (
            <ListItem key={index} divider
              secondaryAction={
                <>
                  {editIndex === index ? (
                    <Box sx={{ display: "flex", flexDirection: "row", gap: "8px" }}>
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
                    fullWidth
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
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Cantidad"
                    type="number"
                    value={editIngredient.quantityOfIngredient}
                    onChange={(e) =>
                      setEditIngredient({
                        ...editIngredient,
                        quantityOfIngredient: +e.target.value,
                      })
                    }
                  />
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Unidad</InputLabel>
                    <Select
                      value={editIngredient.unitOfMeasureId}
                      onChange={(e) =>
                        setEditIngredient({
                          ...editIngredient,
                          unitOfMeasureId: e.target.value,
                        })
                      }
                    >
                      {unit.map((u) => (
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
                  primary={`${ingredient.name} - ${ingredient.quantityOfIngredient} ${unit.find(u => u.id === ingredient.unitOfMeasureId)?.abbreviation || ingredient.unitOfMeasureId}`}
                />

              )}
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error">
          Cancelar
        </Button>
        <Button
          onClick={() => {
            onSave(selectedIngredients);
            onClose();
          }}
          color="primary"
          disabled={selectedIngredients.length === 0}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IngredientDialog;
