import { ingredientsById } from '@/api/ingredients';
import {
  addStock,
  editStock,
  addStockToExisting,
  getIdStockFromIngredient,
  getIdStockFromProduct,
  getStockByIngredient,
} from '@/api/stock'; // Se agrega editStock
import { useIngredientsContext } from '@/app/context/ingredientsContext';
import { useUnitContext } from '@/app/context/unitOfMeasureContext';
import { useAuth } from '@/app/context/authContext';
import { StockModalType } from '@/components/Enums/view-products';
import { UserRole } from '@/components/Enums/user';
import { useProducts } from '@/components/Hooks/useProducts';
import { IStock, SelectedItem } from '@/components/Interfaces/IStock';
import { IUnitOfMeasureResponse } from '@/components/Interfaces/IUnitOfMeasure';
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
} from '@mui/material';
import { useEffect, useState } from 'react';
import { NumericFormat } from 'react-number-format';
import Swal from 'sweetalert2';

export interface ModalStockProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedItem: SelectedItem;
  token: string | null;
}

const initialState = {
  quantityInStock: '',
  minimumStock: '',
  unitOfMeasure: '',
};

const ModalStock: React.FC<ModalStockProps> = ({
  open,
  onClose,
  onSave,
  selectedItem,
  token,
}) => {
  const [formValues, setFormValues] = useState(initialState);
  const { fetchAndSetProducts } = useProducts();
  const { updateIngredient } = useIngredientsContext();
  const { conventionalUnits } = useUnitContext();
  const { userRoleFromToken } = useAuth();

  // Verificar si el usuario es ADMIN
  const isAdmin = userRoleFromToken() === UserRole.ADMIN;

  useEffect(() => {
    let selectedUnit = conventionalUnits.find(
      (u: IUnitOfMeasureResponse) => u.name === selectedItem.unit
    );
    setFormValues({
      quantityInStock: '', // Siempre vacío para permitir agregar cantidad
      minimumStock: selectedItem?.min?.toString() || '',
      unitOfMeasure: selectedUnit?.id || '',
    });
  }, [selectedItem]);

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
   * Previamente se valida que los campos sean correctos y se envian los datos
   */
  const handleSubmit = async () => {
    const { quantityInStock, minimumStock, unitOfMeasure } = formValues;

    if (token) {
      try {
        // Si existe stock o min o unit en el selectedItem, se actualiza stock
        if (selectedItem?.stock || selectedItem?.min || selectedItem?.unit) {
          if (isAdmin) {
            // Para ADMIN: reemplazar el stock (usar editStock)
            const updatePayload: IStock = {
              quantityInStock: parseFloat(quantityInStock),
              minimumStock: parseFloat(minimumStock),
              unitOfMeasureId: unitOfMeasure,
            };

            if (selectedItem.type === StockModalType.PRODUCT) {
              if (selectedItem.idStock) {
                updatePayload.productId = selectedItem.id;
                const result = await editStock(
                  selectedItem.idStock,
                  updatePayload,
                  token
                );
                if (result.statusCode === 400) {
                  handleClose();
                  Swal.fire(
                    'Error',
                    result.message || 'Error al actualizar stock.',
                    'error'
                  );
                  return;
                }
                fetchAndSetProducts(token);
                Swal.fire(
                  'Éxito',
                  'Stock actualizado correctamente.',
                  'success'
                );
              }
            }
            if (selectedItem.type === StockModalType.INGREDIENT) {
              if (selectedItem.idStock && selectedItem.id) {
                updatePayload.ingredientId = selectedItem.id;
                const result = await editStock(
                  selectedItem.idStock,
                  updatePayload,
                  token
                );
                if (result.statusCode === 400) {
                  handleClose();
                  Swal.fire(
                    'Error',
                    result.message || 'Error al actualizar stock.',
                    'error'
                  );
                  return;
                }
                // Pequeño delay para asegurar que la base de datos se haya actualizado
                setTimeout(async () => {
                  const updatedIngredient = await ingredientsById(
                    selectedItem.id!,
                    token
                  );
                  updateIngredient(updatedIngredient);
                }, 500);
                Swal.fire(
                  'Éxito',
                  'Stock actualizado correctamente.',
                  'success'
                );
              }
            }
          } else {
            // Para otros roles: sumar al stock existente (comportamiento original)
            const addPayload = {
              quantityToAdd: parseFloat(quantityInStock),
              minimumStock: parseFloat(minimumStock),
            };

            if (selectedItem.type === StockModalType.PRODUCT) {
              if (selectedItem.idStock) {
                const result = await addStockToExisting(
                  selectedItem.idStock,
                  addPayload,
                  token
                );
                if (result.statusCode === 400) {
                  handleClose();
                  Swal.fire(
                    'Error',
                    result.message || 'Error al agregar stock.',
                    'error'
                  );
                  return;
                }
                fetchAndSetProducts(token);
                Swal.fire('Éxito', 'Stock agregado correctamente.', 'success');
              }
            }
            if (selectedItem.type === StockModalType.INGREDIENT) {
              if (selectedItem.idStock && selectedItem.id) {
                const result = await addStockToExisting(
                  selectedItem.idStock,
                  addPayload,
                  token
                );
                if (result.statusCode === 400) {
                  handleClose();
                  Swal.fire(
                    'Error',
                    result.message || 'Error al agregar stock.',
                    'error'
                  );
                  return;
                }
                // Pequeño delay para asegurar que la base de datos se haya actualizado
                setTimeout(async () => {
                  const updatedIngredient = await ingredientsById(
                    selectedItem.id!,
                    token
                  );
                  updateIngredient(updatedIngredient);
                }, 500);
                Swal.fire('Éxito', 'Stock agregado correctamente.', 'success');
              }
            }
          }
        } else {
          // Para creación, usar la lógica original
          const payload: IStock = {
            quantityInStock: parseFloat(quantityInStock),
            minimumStock: parseFloat(minimumStock),
            unitOfMeasureId: unitOfMeasure,
          };

          if (selectedItem.type === StockModalType.PRODUCT) {
            payload.productId = selectedItem.id;
          } else if (selectedItem.type === StockModalType.INGREDIENT) {
            payload.ingredientId = selectedItem.id;
          }

          // Si no hay stock, se agrega
          const result = await addStock(payload, token);

          if (result.statusCode === 400) {
            handleClose();
            if (
              result.message?.includes('Unit of measure') &&
              result.message?.includes('not compatible')
            ) {
              Swal.fire(
                'Unidad incompatible',
                'La unidad de medida seleccionada no es compatible con el tipo de ingrediente. Por favor, revisá y elegí una unidad válida.',
                'warning'
              );
            } else {
              Swal.fire(
                'Error',
                result.message || 'Error al agregar stock.',
                'error'
              );
            }
            return;
          }

          if (selectedItem.type === StockModalType.PRODUCT) {
            fetchAndSetProducts(token);
          } else if (selectedItem.type === StockModalType.INGREDIENT) {
            const updatedIngredient =
              selectedItem.id &&
              (await ingredientsById(selectedItem.id, token));
            updateIngredient(updatedIngredient);
          }

          Swal.fire('Éxito', 'Stock agregado correctamente.', 'success');
        }
        onSave();
        handleClose();
      } catch (error) {
        console.error('Error al guardar stock:', error);
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
      sx={{ '& .MuiDialog-paper': { minWidth: '500px' } }}
    >
      <DialogTitle
        sx={{
          color: 'var(--color-primary)',
          fontWeight: 'bold',
          fontSize: '1.2rem',
        }}
      >
        {selectedItem?.stock
          ? `Editar Stock de ${selectedItem?.name}`
          : `Agregar Stock a ${selectedItem?.name}`}
      </DialogTitle>
      <DialogContent>
        <NumericFormat
          customInput={TextField}
          autoFocus
          margin="dense"
          label={
            selectedItem?.stock
              ? isAdmin
                ? 'Cantidad en Stock'
                : 'Cantidad a Agregar'
              : 'Cantidad en Stock'
          }
          placeholder={
            selectedItem?.stock
              ? isAdmin
                ? `Stock actual: ${selectedItem.stock} (se reemplazará)`
                : `Stock actual: ${selectedItem.stock}`
              : ''
          }
          fullWidth
          variant="standard"
          name="quantityInStock"
          value={formValues.quantityInStock}
          thousandSeparator="."
          decimalSeparator=","
          allowNegative={false}
          onValueChange={({ value }) =>
            setFormValues((prev) => ({
              ...prev,
              quantityInStock: value, // Este value es sin formato (sin puntos ni comas)
            }))
          }
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
            disabled={!!selectedItem?.stock} // Deshabilitar si ya existe stock
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 200,
                  overflow: 'auto',
                },
              },
            }}
          >
            {conventionalUnits.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <NumericFormat
          customInput={TextField}
          margin="dense"
          label="Stock Mínimo"
          fullWidth
          variant="standard"
          name="minimumStock"
          value={formValues.minimumStock}
          thousandSeparator="."
          decimalSeparator=","
          allowNegative={false}
          onValueChange={({ value }) =>
            setFormValues((prev) => ({
              ...prev,
              minimumStock: value,
            }))
          }
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
