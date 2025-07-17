import { Button, Tooltip } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useDailyCash } from "@/app/context/dailyCashContext";
interface NewMovementButtonProps {
  handleNewMovement: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
const NewMovementButton: React.FC<NewMovementButtonProps> = ({ handleNewMovement }) => {
  const { isCashOpenToday } = useDailyCash();
  return (
    <Tooltip title={!isCashOpenToday ? "Abrir una caja para hacer movimientos" : "Nuevo movimiento"}>
      <span>
        <Button
          variant="outlined"
          onClick={handleNewMovement}
          startIcon={<AddCircleOutlineIcon />}
          disabled={!isCashOpenToday}
        >
          Nuevo Movimiento
        </Button>
      </span>
    </Tooltip>

  );
};

export default NewMovementButton;
