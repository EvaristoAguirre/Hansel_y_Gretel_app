import { addStock, editStock, getIdStockFromProduct } from "@/api/stock"; // Se agrega editStock
import { fetchUnits } from "@/api/unitOfMeasure";
import { useAuth } from "@/app/context/authContext";
import { useProductos } from "@/components/Hooks/useProducts";
import { IStock, SelectedItem } from "@/components/Interfaces/IStock";
import { IUnitOfMeasure } from "@/components/Interfaces/IUnitOfMeasure";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

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

const ModalStock: React.FC<ModalStockProps> = ({ open, onClose, onSave, selectedItem, token }) => {
  const [formValues, setFormValues] = useState(initialState);
  const [units, setUnits] = useState<IUnitOfMeasure[]>([]);
  const { getAccessToken } = useAuth();
  const { fetchAndSetProducts } = useProductos();

  useEffect(() => {
    if (!open) return;

    const authToken = getAccessToken();
    if (authToken) {
      fetchUnits(authToken).then((fetchedUnits) => {

        let updatedUnits = [...fetchedUnits];

        let selectedUnit = fetchedUnits.find((u: IUnitOfMeasure) => u.name === selectedItem.unit);

        setUnits(updatedUnits);

        setFormValues({
          quantityInStock: selectedItem?.stock?.toString() || "",
          minimumStock: selectedItem?.min?.toString() || "",
          unitOfMeasure: selectedUnit?.id
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
   * Manejo del envio del formulario
   * Recupero el Id del stock de un producto
   * getIdStockFromProduct devuelve el id del stock
   * que luego paso por props a editStock
   */
  const handleSubmit = async () => {
    const { quantityInStock, minimumStock, unitOfMeasure } = formValues;

    let idStock: string = ""
    try {
      token && await getIdStockFromProduct(selectedItem.id, token).then((id) => {
        idStock = id
      })
    } catch (error) {
      console.error("Error al obtener las unidades de medida:", error);
    }
    const payload: IStock = {
      quantityInStock: parseInt(quantityInStock, 10),
      minimumStock: parseInt(minimumStock, 10),
      unitOfMeasureId: unitOfMeasure,
    };

    if (selectedItem.type === "product") {
      payload.productId = selectedItem.id;
    } else if (selectedItem.type === "ingredient") {
      payload.ingredientId = selectedItem.id;
    }

    if (token) {
      try {
        // Si existe stock en el selectedItem, se edita, de lo contrario se agrega.
        if (selectedItem?.stock) {
          await editStock(idStock, payload, token,);
        } else {
          await addStock(payload, token);
        }
        fetchAndSetProducts(token);
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
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle
        sx={{
          color: "var(--color-primary)",
          fontWeight: "bold",
          fontSize: "1rem",
        }}
      >
        {selectedItem?.stock ? `Editar Stock de ${selectedItem?.name}` : `Agregar Stock a ${selectedItem?.name}`}
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
        <Select
          fullWidth
          sx={{ mt: 2 }}
          margin="dense"
          variant="standard"
          name="unitOfMeasure"
          value={formValues.unitOfMeasure}
          onChange={handleSelectChange}
          displayEmpty
        >
          <MenuItem value="" disabled>
            Selecciona una unidad
          </MenuItem>
          {units.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.name}
            </MenuItem>
          ))}
        </Select>
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
