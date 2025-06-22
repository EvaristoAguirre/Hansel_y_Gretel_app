import { Button } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
interface NewMovementButtonProps {
  handleNewMovement: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
const NewMovementButton: React.FC<NewMovementButtonProps> = ({ handleNewMovement }) => {
  return (
    <Button variant="outlined" onClick={handleNewMovement} startIcon={<AddCircleOutlineIcon />}>
      Nuevo Movimiento
    </Button>
  );
};

export default NewMovementButton;
