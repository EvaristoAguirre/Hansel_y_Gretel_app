import { useEffect, useState } from "react";
import { Button, Tooltip } from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import OpenCashModal from "./CashModal";
import { checkOpenDailyCash } from '../../../../api/dailyCash';
import { useAuth } from "@/app/context/authContext";
import { dailyCashModalType } from "@/components/Enums/dailyCash";

const OpenCashButton = () => {
  const { getAccessToken } = useAuth();
  const token = getAccessToken();

  const [open, setOpen] = useState(false);
  const [isCashOpenToday, setIsCashOpenToday] = useState(false);

  useEffect(() => {
    const checkOpen = async () => {
      if (!token) return;

      try {
        const data = await checkOpenDailyCash(token);
        if (data) setIsCashOpenToday(data);
      } catch (error) {
        console.error(error);
      }
    };
    checkOpen();
  }, [token]);


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
        type={dailyCashModalType.OPEN}
      />
    </>
  );
};

export default OpenCashButton;
