import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  nombre: string;
  setNombre: (value: string) => void;
  errorNombre: string;
  modalType: "create" | "edit";
}
const CategoryModal: React.FC<CategoryModalProps> = ({ open, onClose, onSave, nombre, setNombre, errorNombre, modalType }) => (
  <Dialog open={open} onClose={onClose} sx={{ "& .MuiDialog-paper": { minWidth: "400px" } }}>
    <DialogTitle>{modalType === "create" ? "Crear Categoría" : "Editar Categoría"}</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Nombre de la categoría"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        fullWidth
        variant="outlined"
        error={!!errorNombre}
        helperText={errorNombre}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancelar</Button>
      <Button onClick={onSave} disabled={!!errorNombre}>Guardar</Button>
    </DialogActions>
  </Dialog>
);

export default CategoryModal;
