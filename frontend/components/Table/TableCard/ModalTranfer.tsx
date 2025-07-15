import { getTablesAvailable } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";
import { capitalizeFirstLetter } from "@/components/Utils/CapitalizeFirstLetter";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface TransferTableModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (toTableId: string) => void;
  excludeTableId?: string;
}

export default function TransferTableModal({
  open,
  onClose,
  onConfirm,
  excludeTableId,
}: TransferTableModalProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [noTablesMessage, setNoTablesMessage] = useState<string | null>(null);

  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      const result = token && await getTablesAvailable(token);

      if (result?.noTablesAvailable) {
        setTables([]);
        setNoTablesMessage("No hay mesas disponibles");
      } else {
        setTables(result);
        setNoTablesMessage(null);
      }

      setLoading(false);
    };

    if (open) fetchTables();
  }, [open, excludeTableId]);

  const handleConfirm = () => {
    if (selectedTableId) {
      onConfirm(selectedTableId);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} sx={{ "& .MuiDialog-paper": { minWidth: "500px" } }}>
      <DialogTitle
        sx={{ color: "primary.main", fontWeight: "bold", fontSize: "1.2rem", display: "flex", justifyContent: "center" }}
      >
        Selecciona la mesa de destino:
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : noTablesMessage ? (
          <Typography color="textSecondary" sx={{ mt: 2 }}>
            {noTablesMessage}
          </Typography>
        ) : (
          <List
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              overflow: "auto",
              maxHeight: 300,
            }}
          >
            {[...tables]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((table) => (
                <ListItem key={table.id} disablePadding>
                  <ListItemButton
                    selected={selectedTableId === table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    sx={{ borderBottom: "1px solid #ccc" }}
                  >
                    <ListItemText primary={capitalizeFirstLetter(table.name)} />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} disabled={!selectedTableId}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
