import { ITopping, IToppingsGroup } from "@/components/Interfaces/IToppings";
import LoadingLottie from "@/components/Loader/Loading";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (group: { name: string; toppingsIds: string[] }) => void;
  isLoading?: boolean;
  toppings: ITopping[];
  initialData?: IToppingsGroup | null;
}

const FormToppingsGroup = ({
  open,
  onClose,
  onSave,
  isLoading = false,
  toppings,
  initialData = null,
}: Props) => {
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState(false);
  const [toppingsError, setToppingsError] = useState(false);

  const isFormValid = name.trim() !== "" && selectedIds.length > 0;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSelectedIds(initialData.toppings.map((t) => t.id));
    } else {
      setName("");
      setSelectedIds([]);
    }

    setNameError(false);
    setToppingsError(false);
  }, [initialData, open]);


  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(value.trim() === "");
  }

  const handleChange = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    setSelectedIds(updated);
    setToppingsError(updated.length === 0);
  };

  useEffect(() => {
    console.log("🌕", selectedIds);
  }, [selectedIds]);

  const handleSubmit = () => {
    if (!isFormValid) return;
    onSave({ name: name.trim(), toppingsIds: selectedIds });
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {initialData ? "Editar Grupo de Toppings" : "Nuevo Grupo de Agregados"}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Nombre del Grupo"
          fullWidth
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          margin="normal"
          error={nameError}
          helperText={nameError ? "El nombre del grupo es obligatorio" : ""}
        />

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Selecciona los agregados:
        </Typography>

        {toppings.length === 0 ? (
          <LoadingLottie />
        ) : (
          <>
            <div
              style={{
                maxHeight: "250px",
                overflowY: "auto",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
                marginTop: "8px",
              }}
            >
              <FormGroup>
                {toppings.map((topping) => (
                  <FormControlLabel
                    key={topping.id}
                    control={
                      <Checkbox
                        checked={selectedIds.includes(topping.id)}
                        onChange={() => handleChange(topping.id)}
                      />
                    }
                    label={capitalizeFirstLetter(topping.name)}
                  />
                ))}
              </FormGroup>
            </div>

            {toppingsError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                Debes seleccionar al menos un topping.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || isLoading}
        >
          {initialData ? "Guardar Cambios" : "Crear Grupo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormToppingsGroup;
