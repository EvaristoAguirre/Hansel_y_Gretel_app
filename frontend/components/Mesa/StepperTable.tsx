import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { MesaInterface } from '../Interfaces/Cafe_interfaces';
import { OrderCreated } from '../Pedido/useOrderStore';
import MesaEditor from './MesaEditor';
import PedidoEditor, { Product } from '../Pedido/PedidoEditor';
import Order from '../Pedido/Order';

const steps = ['Info Mesa', 'Editar Pedido', 'Confirmación'];

interface Props {
  mesa: MesaInterface;
  view: string;
  onAbrirPedido: () => void;
}

export const StepperTable: React.FC<Props> = ({ mesa, view, onAbrirPedido }) => {
  const [activeStep, setActiveStep] = React.useState(0);
  const [completed, setCompleted] = React.useState<{ [k: number]: boolean }>({});
  const [ordenAbierta, setOrdenAbierta] = React.useState<OrderCreated | undefined>();

  const [productosConfirmados, setProductosConfirmados] = React.useState<
    { productId: string; quantity: number; price: number; name: string }[]
  >([]);

  const totalSteps = () => steps.length;
  const completedSteps = () => Object.keys(completed).length;
  const isLastStep = () => activeStep === totalSteps() - 1;
  const allStepsCompleted = () => completedSteps() === totalSteps();

  const handleNext = () => {
    setActiveStep((prev) => (isLastStep() ? prev : prev + 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleStep = (step: number) => () => {
    setActiveStep(step);
  };

  const handleComplete = () => {
    setCompleted({ ...completed, [activeStep]: true });
    handleNext();
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
    setOrdenAbierta(undefined);
  };

  const eliminarProductoConfirmado = (id: string) => {
    setProductosConfirmados(
      productosConfirmados.filter((p: Product) => p.productId !== id)
    );
  };

  const imprimirComanda = () => {
    console.log("Imprimiendo comanda:", productosConfirmados);
    // función de impresión
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <MesaEditor
          mesa={mesa} view="mesaEditor"
          onAbrirPedido={onAbrirPedido}
          setOrdenAbierta={setOrdenAbierta}
          handleNext={handleNext}
        />;
      case 1:
        return ordenAbierta ? (
          <PedidoEditor
            mesa={mesa}
            ordenAbierta={ordenAbierta}
            setProductosConfirmados={setProductosConfirmados}
            productosConfirmados={productosConfirmados}
            handleNext={handleNext}
          />
        ) : (
          null
        );
      case 2:
        return (
          productosConfirmados.length > 0 ? (
            <Order
              productosConfirmados={productosConfirmados}
              eliminarProductoConfirmado={eliminarProductoConfirmado}
              imprimirComanda={imprimirComanda}
              handleDeleteOrder={handleReset}
              ordenAbierta={ordenAbierta}
            />
          ) : (
            <Typography>No hay productos confirmados, volver al paso 2</Typography>
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
