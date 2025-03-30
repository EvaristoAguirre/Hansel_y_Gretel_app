import { ingredientsById } from "@/api/ingredients";
import {
  addStock,
  editStock,
  getIdStockFromIngredient,
  getIdStockFromProduct,
  getStockByIngredient,
} from "@/api/stock"; // Se agrega editStock
import { fetchUnits } from "@/api/unitOfMeasure";
import { useAuth } from "@/app/context/authContext";
import { useIngredientsContext } from "@/app/context/ingredientsContext";
import { StockModalType } from "@/components/Enums/view-products";
import { useProductos } from "@/components/Hooks/useProducts";
import { IStock, SelectedItem } from "@/components/Interfaces/IStock";
import { IUnitOfMeasure } from "@/components/Interfaces/IUnitOfMeasure";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export interface ModalStockProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedItem: SelectedItem;
  token: string | null;
}

const initialState = {
  quantityInStock: "",
  minimumStock: "",
  unitOfMeasure: "",
};

const ModalStock: React.FC<ModalStockProps> = ({
  open,
  onClose,
  onSave,
  selectedItem,
  token,
}) => {
  const [formValues, setFormValues] = useState(initialState);
  const [units, setUnits] = useState<IUnitOfMeasure[]>([]);
  const { getAccessToken } = useAuth();
  const { fetchAndSetProducts } = useProductos();
  const { updateIngredient } = useIngredientsContext();

  useEffect(() => {
    if (!open) return;
    const token = getAccessToken();
    if (token) {
      fetchUnits(token).then((fetchedUnits) => {
        let updatedUnits = [...fetchedUnits];

        let selectedUnit = fetchedUnits.find(
          (u: IUnitOfMeasure) => u.name === selectedItem.unit
        );

        setUnits(updatedUnits);

        setFormValues({
          quantityInStock: selectedItem?.stock?.toString() || "",
          minimumStock: selectedItem?.min?.toString() || "",
          unitOfMeasure: selectedUnit?.id || "",
        });
      });
    }
  }, [open, getAccessToken, selectedItem]);

  // Manejo de cambios en los TextField
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Manejo del cambio en el Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setFormValues((prev) => ({
      ...prev,
      unitOfMeasure: e.target.value,
    }));
  };
  /**
   * Función que se ejecuta cuando se hace clic en el boton "Guardar"
   * Previamente se valida que los campos sean correctos
   * y mas adelante explico como se hace las llamadas
   */
  const handleSubmit = async () => {
    const { quantityInStock, minimumStock, unitOfMeasure } = formValues;
    const payload: IStock = {
      quantityInStock: parseInt(quantityInStock, 10),
      minimumStock: parseInt(minimumStock, 10),
      unitOfMeasureId: unitOfMeasure,
    };

    if (selectedItem.type === StockModalType.PRODUCT) {
      payload.productId = selectedItem.id;
    } else if (selectedItem.type === StockModalType.INGREDIENT) {
      payload.ingredientId = selectedItem.id;
    }

    if (token) {
      try {
        // Si existe stock en el selectedItem, se edita, de lo contrario se agrega.
        if (selectedItem?.stock) {
          let idStock: string = "";
          if (selectedItem.type === StockModalType.PRODUCT) {
            try {
              token &&
                selectedItem.id &&
                (await getIdStockFromProduct(selectedItem.id, token).then(
                  (id) => {
                    idStock = id;
                  }
                ));
              fetchAndSetProducts(token);
              Swal.fire("Éxito", "Stock editado correctamente.", "success");
            } catch (error) {
              console.error("Error al obtener el id del stock:", error);
            }
          }
          if (selectedItem.type === StockModalType.INGREDIENT) {
            if (selectedItem.id) {
              /**
               * Recupero el id del stock del ingrediente
               * Luego lo paso por props a editStock
               * Por ultimo lo q se hace, es hacer un fetch a igredient/id y actualizarlo en el context
               */
              try {
                const ingredientData = await ingredientsById(
                  selectedItem.id,
                  token
                );
                if (ingredientData?.stock) {
                  const idStock = ingredientData.stock.id;
                  await editStock(idStock, payload, token);
                  const updatedIngredient = await ingredientsById(
                    selectedItem.id,
                    token
                  );
                  updateIngredient(updatedIngredient);

                  Swal.fire("Éxito", "Stock editado correctamente.", "success");
                } else {
                  console.error("No se encontró stock para el ingrediente");
                }
              } catch (error) {
                console.error("Error al obtener el id del stock:", error);
              }
            }
          }
        } else if (selectedItem.stock === null) {
          Swal.fire(
            "Error",
            "No se puede agregar stock a un producto sin stock",
            "error"
          );
          return;
        } else {
          await addStock(payload, token);
          Swal.fire("Éxito", "Stock agregado correctamente.", "success");
        }
        onSave();
        handleClose();
      } catch (error) {
        console.error("Error al guardar stock:", error);
      }
    }
  };

  const handleClose = () => {
    setFormValues(initialState);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      sx={{ "& .MuiDialog-paper": { minWidth: "500px" } }}
    >
      <DialogTitle
        sx={{
          color: "var(--color-primary)",
          fontWeight: "bold",
          fontSize: "1.2rem",
        }}
      >
        {selectedItem?.stock
          ? `Editar Stock de ${selectedItem?.name}`
          : `Agregar Stock a ${selectedItem?.name}`}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Cantidad en Stock"
          type="number"
          fullWidth
          variant="standard"
          name="quantityInStock"
          value={formValues.quantityInStock}
          onChange={handleInputChange}
        />
        <FormControl variant="standard" fullWidth sx={{ mt: 2 }}>
          <InputLabel id="unitOfMeasure-label">Unidad de Medida</InputLabel>
          <Select
            labelId="unitOfMeasure-label"
            id="unitOfMeasure"
            name="unitOfMeasure"
            value={formValues.unitOfMeasure}
            onChange={handleSelectChange}
            displayEmpty
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 200,
                  overflow: "auto",
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

        <TextField
          margin="dense"
          label="Stock Mínimo"
          type="number"
          fullWidth
          variant="standard"
          name="minimumStock"
          value={formValues.minimumStock}
          onChange={handleInputChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          disabled={!formValues.quantityInStock || !formValues.unitOfMeasure}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalStock;
