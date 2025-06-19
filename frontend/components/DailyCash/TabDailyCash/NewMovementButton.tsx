import { Button } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

const NewMovementButton = () => {
  const handleNewMovement = () => {
    // Lógica para nuevo movimiento
    console.log("Nuevo Movimiento");
  };

  return (
    <Button variant="outlined" onClick={handleNewMovement} startIcon={<AddCircleOutlineIcon />}>
      Nuevo Movimiento
    </Button>
  );
};

export default NewMovementButton;
