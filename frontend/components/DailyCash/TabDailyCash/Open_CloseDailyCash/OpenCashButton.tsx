import { useEffect, useState } from "react";
import { Button, Tooltip } from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { checkOpenDailyCash } from '../../../../api/dailyCash';
import { useAuth } from "@/app/context/authContext";
import { dailyCashModalType } from "@/components/Enums/dailyCash";
import CashModal from "./CashModal";
import { useDailyCash } from "@/app/context/dailyCashContext";

const OpenCashButton = () => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const [open, setOpen] = useState(false);

  const { isCashOpenToday } = useDailyCash();




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

      <CashModal
        open={open}
        onClose={() => setOpen(false)}
        type={dailyCashModalType.OPEN}
      />
    </>
  );
};

export default OpenCashButton;
