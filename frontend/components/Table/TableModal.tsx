import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { TableModalType } from "../Enums/table";
import { TableModalProps } from "../Interfaces/ITable";
import { capitalizeFirstLetter } from "../Utils/CapitalizeFirstLetter";

const TableModal: React.FC<TableModalProps> = ({ open, onClose, onSave, nombre, setNombre, errorNombre, modalType, room }) => (
  <Dialog open={open} onClose={onClose} sx={{ "& .MuiDialog-paper": { minWidth: "400px" } }}>
    <DialogTitle sx={{ color: "primary.main", fontWeight: "bold", fontSize: "1rem" }}>
      {modalType === TableModalType.CREATE ? `Crear Mesa en: ${capitalizeFirstLetter(room)}`
        : "Editar Mesa"}
    </DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Nombre de la mesa"
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

export default TableModal;
