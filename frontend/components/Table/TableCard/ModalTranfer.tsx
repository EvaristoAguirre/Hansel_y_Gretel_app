import { getTablesAvailable } from "@/api/tables";
import { useAuth } from "@/app/context/authContext";
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

  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      const result = token && await getTablesAvailable(token);
      const filtered = result.filter((t: any) => t.id !== excludeTableId);
      setTables(filtered);
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
        Seleccioná la mesa de destino:
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <List
            sx={{
              width: "100%",
              bgcolor: "background.paper",
              overflow: "auto",
              maxHeight: 300,
            }}
          >
            {tables.map((table) => (
              <ListItem key={table.id} disablePadding>
                <ListItemButton
                  selected={selectedTableId === table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  sx={{ borderBottom: "1px solid #ccc" }}
                >
                  <ListItemText primary={`${table.name}`} />
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
