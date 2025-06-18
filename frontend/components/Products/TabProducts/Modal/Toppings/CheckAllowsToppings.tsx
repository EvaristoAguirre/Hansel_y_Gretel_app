import { FormControlLabel, Switch } from "@mui/material";
import { useEffect } from 'react';

export const CheckAllowsToppings = ({ allowsToppings, setAllowsToppings }: { allowsToppings: boolean, setAllowsToppings: (allowsToppings: boolean) => void }) => {

  return (
    <FormControlLabel
      label="Permite Agregados"
      control={
        <Switch
          checked={allowsToppings}
          onChange={(event) => setAllowsToppings(event.target.checked)}
          sx={{  }}
        />
      }
      style={{ fontSize: "0.8rem", color: `${allowsToppings ? "green" : "gray"}`, marginTop: "0.5rem", marginBottom: "0.5rem" }}
    />


  );
}