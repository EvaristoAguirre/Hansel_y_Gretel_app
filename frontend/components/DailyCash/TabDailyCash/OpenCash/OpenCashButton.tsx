import { useState } from "react";
import { Button, Tooltip } from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import OpenCashModal from "./OpenCashModal";

const OpenCashButton = () => {
  const [open, setOpen] = useState(false);

  //Este valor vendría desde el back
  //Simulado por ahora
  const isCashOpenToday = false;

  return (
    <>
      <Tooltip
        title={
          isCashOpenToday
            ? "Ya hay una caja abierta hoy"
            : "Abrir una nueva caja para hoy"
        }
      >
        <span>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddBoxIcon />}
            onClick={() => setOpen(true)}
            disabled={isCashOpenToday}
          >
            Abrir Caja
          </Button>
        </span>
      </Tooltip>

      <OpenCashModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

export default OpenCashButton;
