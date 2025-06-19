import { Button } from "@mui/material";
import AddBoxIcon from '@mui/icons-material/AddBox';

const OpenCashButton = () => {
  const handleOpenCash = () => {
    // Lógica para abrir caja
    console.log("Abrir caja");
  };

  return (
    <Button variant="contained" color="primary" onClick={handleOpenCash} startIcon={<AddBoxIcon />}>
      Abrir Caja
    </Button>
  );
};

export default OpenCashButton;
