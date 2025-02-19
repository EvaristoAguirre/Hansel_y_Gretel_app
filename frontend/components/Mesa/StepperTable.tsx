import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { MesaInterface } from '../Interfaces/Cafe_interfaces';
import { OrderCreated, useOrderStore } from '../Pedido/useOrderStore';
import MesaEditor from './MesaEditor';
import PedidoEditor, { Product } from '../Pedido/PedidoEditor';
import Order from '../Pedido/Order';
import { useOrderContext } from '../../app/context/order.context';

const steps = ['Info Mesa', 'Editar Pedido', 'Confirmación'];

interface Props {
  selectedMesa: MesaInterface;
  view: string;
  onAbrirPedido: () => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
}

export const StepperTable: React.FC<Props> = (
  { selectedMesa, view, onAbrirPedido, activeStep, setActiveStep }
) => {
  const [completed, setCompleted] = React.useState<{ [k: number]: boolean }>({});

  const {
    confirmedProducts,
    handleResetSelectedOrder
  } = useOrderContext();

  const { selectedOrderByTable } = useOrderContext();

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

  const handleComplete = () => {
    setCompleted({ ...completed, [activeStep]: true });
    handleNextStep();
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

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <MesaEditor
          selectedMesa={selectedMesa} view="mesaEditor"
          onAbrirPedido={onAbrirPedido}
          handleNextStep={handleNextStep}
        />;
      case 1:
        return selectedMesa.state === 'open' ? (
          selectedOrderByTable && (
            <PedidoEditor
              handleNextStep={handleNextStep}
            />
          )
        ) : <div className='flex justify-center text-red-500 font-bold my-16'>
          Completar paso 1
        </div>;
      case 2:
        return (
          confirmedProducts.length > 0 ? (
            <Order
              imprimirComanda={imprimirComanda}
              handleDeleteOrder={handleReset}
              selectedMesa={selectedMesa}
            />
          ) : (
            <div className='flex justify-center text-red-500 font-bold my-16'>No hay productos confirmados, volver al paso 2</div>
          )
        );
      default:
        return <Typography>Paso desconocido</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
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
            <Typography sx={{ mt: 2, mb: 1 }}>Todos los pasos completados</Typography>
            <Button onClick={handleReset}>Reiniciar</Button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box sx={{ mt: 2, mb: 1 }}>{renderStepContent(activeStep)}</Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
                Atrás
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {/* <Button onClick={handleNext} sx={{ mr: 1 }}>
                Siguiente
              </Button>
              {activeStep !== steps.length - 1 && (
                <Button onClick={handleComplete}>Completar paso</Button>
              )} */}
            </Box>
          </React.Fragment>
        )}
      </div>
    </Box>
  );
};
