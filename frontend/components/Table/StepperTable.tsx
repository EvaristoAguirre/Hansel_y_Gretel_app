import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { MesaInterface } from "../Interfaces/Cafe_interfaces";
import PedidoEditor from "../Order/OrderEditor";
import Order from "../Order/Order";
import { useOrderContext } from "../../app/context/order.context";
import PayOrder from "../Order/Pay";
import TableEditor from "./TableEditor";
import { TableState } from "../Enums/Enums";
import { useOrderStore } from "../Order/useOrderStore";

const steps = ["Info Mesa", "Editar Pedido", "Confirmación", "Pago"];

interface Props {
  selectedMesa: MesaInterface;
  view: string;
  onAbrirPedido: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
}

export const StepperTable: React.FC<Props> = ({
  selectedMesa,
  onAbrirPedido,
  activeStep,
  setActiveStep,
}) => {
  const [completed, setCompleted] = React.useState<{ [k: number]: boolean }>(
    {}
  );

  const { confirmedProducts, handleResetSelectedOrder } = useOrderContext();

  const { selectedOrderByTable } = useOrderContext();

  const { connectWebSocket } = useOrderStore();

  const totalSteps = () => steps.length;
  const completedSteps = () => Object.keys(completed).length;
  const isLastStep = () => activeStep === totalSteps() - 1;
  const allStepsCompleted = () => completedSteps() === totalSteps();

  const handleNextStep = () => {
    setActiveStep(isLastStep() ? activeStep : activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep > 0 ? activeStep - 1 : activeStep);
  };

  const handleStep = (step: number) => () => {
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
    handleResetSelectedOrder();
  };

  const imprimirComanda = () => {
    console.log("Imprimiendo comanda:", confirmedProducts);
    // función de impresión
  };

  React.useEffect(() => {
    // Cuando selectedOrderByTable cambie, se actualiza el componente
    setActiveStep(0); // O alguna lógica específica que necesites
  }, [selectedOrderByTable]);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return selectedMesa.state === TableState.AVAILABLE ||
          selectedMesa.state === TableState.OPEN ? (
          <TableEditor
            view="mesaEditor"
            onAbrirPedido={onAbrirPedido}
            handleNextStep={handleNextStep}
            handleCompleteStep={handleCompleteStep}
          />
        ) : selectedMesa.state === TableState.PENDING_PAYMENT ? (
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
        return selectedMesa.state === TableState.OPEN ? (
          selectedOrderByTable && (
            <PedidoEditor
              handleNextStep={handleNextStep}
              handleCompleteStep={handleCompleteStep}
            />
          )
        ) : selectedMesa.state === TableState.PENDING_PAYMENT ? (
          <div className="flex justify-center text-red-500 font-bold my-16">
            Orden pendiente de pago, cobrar y luego iniciar una nueva orden.
          </div>
        ) : selectedMesa.state === TableState.CLOSED ? (
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
            selectedMesa={selectedMesa}
            handleNextStep={handleNextStep}
            handleCompleteStep={handleCompleteStep}
          />
        ) : (
          <div className="flex justify-center text-red-500 font-bold my-16">
            No hay productos confirmados, volver al paso 2
          </div>
        );
      case 3:
        return <PayOrder handleComplete={handleComplete} />;
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
