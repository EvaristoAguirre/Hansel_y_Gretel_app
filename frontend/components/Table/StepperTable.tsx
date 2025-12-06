import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Order from '../Order/Order';
import { useOrderContext } from '../../app/context/order.context';
import PayOrder from '../Order/Pay';
import TableEditor from './TableEditor';
import OrderEditor from '../Order/OrderEditor';
import { ITable } from '../Interfaces/ITable';
import { TableState } from '../Enums/table';
import { editTable } from '@/api/tables';
import { useRoomContext } from '@/app/context/room.context';
import { useTableStore } from './useTableStore';
import { useOrderStore } from '../Order/useOrderStore';
import { useAuth } from '@/app/context/authContext';
import { TableBar } from '@mui/icons-material';
import { UserRole } from '../Enums/user';

const steps = ['Info Mesa', 'Editar Pedido', 'Productos Confirmados', 'Pago'];

interface Props {
  selectedTable: ITable;
  view: string;
  onAbrirPedido: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
}

export const StepperTable: React.FC<Props> = ({
  selectedTable,
  onAbrirPedido,
  activeStep,
  setActiveStep,
}) => {
  const [completed, setCompleted] = React.useState<{ [k: number]: boolean }>(
    {}
  );
  const { confirmedProducts, selectedOrderByTable, setSelectedOrderByTable, fetchOrderBySelectedTable } = useOrderContext();
  const { setSelectedTable } = useRoomContext();
  const { updateTable } = useTableStore();
  const { updateOrder } = useOrderStore();
  const { getAccessToken, userRoleFromToken } = useAuth();
  const token = getAccessToken();
  const userRole = userRoleFromToken();


  const totalSteps = () => steps.length;
  const completedSteps = () => Object.keys(completed).length;
  const isLastStep = () => activeStep === totalSteps() - 1;
  const allStepsCompleted = () => completedSteps() === totalSteps();

  const handleNextStep = () => {
    // Si el usuario es MOZO y está intentando avanzar al paso 4 (pago), no permitirlo
    const nextStep = isLastStep() ? activeStep : activeStep + 1;
    if (userRole === UserRole.MOZO && nextStep === 3) {
      // El mozo no puede acceder al paso 4 (pago), se queda en el paso 3
      return;
    }
    setActiveStep(nextStep);
  };

  const handleBack = () => {
    setActiveStep(activeStep > 0 ? activeStep - 1 : activeStep);
  };

  const handleStep = (step: number) => () => {
    // Si el usuario es MOZO, no permitir acceso al paso 4 (pago)
    if (userRole === UserRole.MOZO && step === 3) {
      return; // No permitir acceso al paso 4
    }
    setActiveStep(step);
  };

  const handleCompleteStep = () => {
    setCompleted({ ...completed, [activeStep]: true });
  };
  const handleComplete = () => {
    setCompleted({ ...completed, [activeStep]: true });
    handleReset();
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
    // handleResetSelectedOrder();
  };

  const imprimirComanda = () => {
    console.log("Imprimiendo comanda:", confirmedProducts);
    // función de impresión
  };

  const handleTableAvailable = async (table: ITable, token: string) => {
    const tableEdited = await editTable({ ...table, state: TableState.AVAILABLE }, token);
    if (tableEdited) {
      setSelectedTable(tableEdited);
      updateTable(tableEdited);
      setSelectedOrderByTable(null);
      fetchOrderBySelectedTable();
    }
    handleComplete();
  };


  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return selectedTable.state === TableState.AVAILABLE ||
          selectedTable.state === TableState.OPEN ? (
          <TableEditor
            view="mesaEditor"
            onAbrirPedido={onAbrirPedido}
            handleNextStep={handleNextStep}
            handleCompleteStep={handleCompleteStep}
          />
        ) : selectedTable.state === TableState.PENDING_PAYMENT ? (
          <div className="flex justify-center text-red-500 font-bold my-16">
            Orden pendiente de pago, cobrar y luego iniciar una nueva orden.
          </div>
        ) : (
          <div className="flex justify-center text-red-500 font-bold my-16">
            La mesa ya paso a "Pagada", pasar mesa a disponible e iniciar nuevo
            pedido.
          </div>
        );
      case 1:
        return selectedTable.state === TableState.OPEN ? (
          <OrderEditor
            handleNextStep={handleNextStep}

            handleBackStep={handleBack}
            handleReset={handleReset}
            handleCompleteStep={handleCompleteStep}
          />
        ) : selectedTable.state === TableState.PENDING_PAYMENT ? (
          <div className="flex justify-center text-red-500 font-bold my-16">
            Orden pendiente de pago, cobrar y luego iniciar una nueva orden.
          </div>
        ) : selectedTable.state === TableState.CLOSED ? (
          <div className="flex justify-center text-red-500 font-bold my-16">
            La orden ya paso a "Pagada", pasar mesa a disponible e iniciar nuevo
            pedido.
          </div>
        ) : (
          <div className="flex justify-center text-red-500 font-bold my-16">
            Completar paso 1
          </div>
        );
      case 2:
        return confirmedProducts.length > 0 ? (
          <Order
            imprimirComanda={imprimirComanda}
            handleDeleteOrder={handleReset}
            selectedTable={selectedTable}
            handleNextStep={handleNextStep}
            handleReset={handleReset}
            handleCompleteStep={handleCompleteStep}
          />
        ) : (
          <div className="flex justify-center text-red-500 font-bold my-16">
            No hay productos confirmados, volver al paso 2
          </div>
        );
      case 3:
        // El paso 4 (pago) solo es accesible para ENCARGADO y ADMIN, no para MOZO
        if (userRole === UserRole.MOZO) {
          return (
            <div className="flex justify-center text-red-500 font-bold my-16">
              El pago debe ser realizado por el encargado. La orden está pendiente de pago.
            </div>
          );
        }
        return selectedOrderByTable ? <PayOrder handleComplete={handleComplete} /> :
          (selectedTable?.state === TableState.CLOSED) && (
            <>
              <div className="flex justify-center text-red-500 font-bold my-16">
                Orden PAGADA. Finalizó el ciclo de la orden.
              </div>
              <Button
                fullWidth
                variant="outlined"
                sx={{
                  mt: 2,
                  borderColor: "#7e9d8a",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#f9b32d",
                    color: "black",
                  },
                }}
                onClick={() => handleTableAvailable(selectedTable, token!)}
              >
                <TableBar sx={{ mr: 1 }} />
                Pasar Mesa a: <Box component="span" sx={{ color: "green", ml: 1 }}>Disponible</Box>
              </Button>
            </>
          )
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stepper nonLinear activeStep={activeStep}>
        {steps.map((label, index) => (
          <Step key={label} completed={completed[index]}>
            <StepButton color="inherit" onClick={handleStep(index)}>
              {label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
      <div>
        {allStepsCompleted() ? (
          <React.Fragment>
            <Typography sx={{ mt: 2, mb: 1 }}>
              Todos los pasos completados
            </Typography>
            <Button onClick={handleReset}>Reiniciar</Button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box sx={{ mt: 2, mb: 1 }}>{renderStepContent(activeStep)}</Box>
            <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
              <Button
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Atrás
              </Button>
              <Box sx={{ flex: "1 1 auto" }} />
              <Button onClick={handleNextStep} sx={{}}>
                Siguiente
              </Button>
            </Box>
          </React.Fragment>
        )}
      </div>
    </Box>
  );
};
