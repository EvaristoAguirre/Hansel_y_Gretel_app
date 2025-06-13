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
import { Box } from "@mui/system";
import { useAuth } from "@/app/context/authContext";
import { ProductForm } from "@/components/Interfaces/IProducts";
import { IUnitOfMeasureForm } from "@/components/Interfaces/IUnitOfMeasure";
import { TabProductKey } from "@/components/Enums/view-products";
import { useIngredientsContext } from '../../../app/context/ingredientsContext';
import { TypeBaseUnitIngredient } from "@/components/Enums/Ingredients";
import { useUnitContext } from '../../../app/context/unitOfMeasureContext';
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";

interface IngredientDialogProps {
  onSave: (ingredientsForm: IingredientForm[]) => void;
  form: ProductForm;
  units: IUnitOfMeasureForm[];
  handleSetDisableTabs: (tabKeys: TabProductKey[]) => void;
}

const IngredientDialog: React.FC<IngredientDialogProps> = ({ onSave, form, units, handleSetDisableTabs }) => {
  const { getAccessToken } = useAuth();
  const { ingredients } = useIngredientsContext();
  const { unitsOfMass, unitsOfVolume, unitsOfUnit, fetchUnitsMass, fetchUnitsVolume, fetchUnitsUnit } = useUnitContext()
  const [selectedIngredients, setSelectedIngredients] = useState<IingredientForm[]>([]);
  const [newIngredient, setNewIngredient] = useState<IingredientForm>({
    name: "",
    ingredientId: "",
    quantityOfIngredient: 0,
    unitOfMeasureId: "",
    type: null,
    isTopping: false,
    extraCost: null
  });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editIngredient, setEditIngredient] = useState<IingredientForm | null>(null);
  const [isAddButtonDisabled, setIsAddButtonDisabled] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    if (form.ingredients && form.ingredients.length > 0) {

      const preparedIngredients = form.ingredients.map((ingredient: IingredientForm) => ({
        name: ingredient.name,
        ingredientId: ingredient.ingredientId,
        quantityOfIngredient: Number(ingredient?.quantityOfIngredient),
        unitOfMeasureId: ingredient.unitOfMeasureId,
        type: ingredient.type,
        isTopping: ingredient.isTopping,
        extraCost: ingredient.extraCost
      }))
      setSelectedIngredients(preparedIngredients);
    }
    fetchUnitsMass();
    fetchUnitsVolume();
    fetchUnitsUnit();
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
        type: null,
        isTopping: false,
        extraCost: null
      });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const handleStartEdit = (index: number) => {
    const ingredientToEdit = selectedIngredients[index];
    const contextIngredient = ingredients.find(ing => ing.id === ingredientToEdit.ingredientId);
    const type = contextIngredient?.type ?? null;

    setEditIndex(index);
    setEditIngredient({ ...ingredientToEdit, type });

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

  const unitsMapping = {
    [TypeBaseUnitIngredient.MASS]: unitsOfMass,
    [TypeBaseUnitIngredient.VOLUME]: unitsOfVolume,
    [TypeBaseUnitIngredient.UNIT]: unitsOfUnit,
  };
  const unitsToShow = newIngredient.type && unitsMapping[newIngredient.type] || [];
  const unitsForEdit = editIngredient?.type && unitsMapping[editIngredient.type] || [];

  return (
    <>
      <DialogContent sx={{ padding: 0 }}>
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
              onChange={(e) => {
                const selectedIngredient = ingredients.find(ing => ing.id === e.target.value);
                const type = selectedIngredient?.type ?? null;

                setNewIngredient({
                  ...newIngredient,
                  ingredientId: e.target.value,
                  name: e.target.name,
                  type
                });
              }}

            >
              {ingredients.map((ingredient) => (
                <MenuItem key={ingredient.id} value={ingredient.id}>
                  {capitalizeFirstLetter(ingredient.name)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Cantidad"
            type="number"
            margin="dense"
            value={newIngredient.quantityOfIngredient ?? ""}
            onChange={(e) => {
              const val = e.target.value;

              if (val === "") {
                setNewIngredient({ ...newIngredient, quantityOfIngredient: null });
                return;
              }

              const value = parseFloat(val);
              if (isNaN(value) || value <= 0) return;

              setNewIngredient({ ...newIngredient, quantityOfIngredient: value });
            }}

            onBlur={(e) => {
              const value = parseFloat(e.target.value);
              if (isNaN(value) || value <= 0) {
                setNewIngredient({ ...newIngredient, quantityOfIngredient: null });
              } else {
                setNewIngredient({ ...newIngredient, quantityOfIngredient: value });
              }
            }}

            inputProps={{ min: 0, step: 0.1 }}
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
              {unitsToShow.map((unit) => (
                <MenuItem key={unit.id} value={unit.id}>
                  {unit.name}
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
                <div style={{ width: "90%", display: "flex", flexDirection: "row", gap: "8px" }}>
                  <TextField
                    sx={{ width: "40%" }}
                    margin="dense"
                    label="Nombre"
                    type="string"
                    value={capitalizeFirstLetter(editIngredient.name)}
                    onChange={(e) => {
                      setEditIngredient({
                        ...editIngredient,
                        name: e.target.value,
                      })

                    }
                    }
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                  <TextField
                    sx={{ width: "20%" }}
                    margin="dense"
                    label="Cantidad"
                    type="number"
                    value={editIngredient.quantityOfIngredient ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;

                      if (val === "") {
                        setEditIngredient({ ...editIngredient, quantityOfIngredient: null });
                        return;
                      }

                      const value = parseFloat(val);
                      if (isNaN(value) || value <= 0) return;

                      setEditIngredient({ ...editIngredient, quantityOfIngredient: value });
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value <= 0) {
                        setEditIngredient({ ...editIngredient, quantityOfIngredient: null });
                      } else {
                        setEditIngredient({ ...editIngredient, quantityOfIngredient: value });
                      }
                    }}
                    inputProps={{ min: 0, step: 0.1 }}
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
                      {unitsForEdit.map((u: IUnitOfMeasureForm) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              ) : (
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
