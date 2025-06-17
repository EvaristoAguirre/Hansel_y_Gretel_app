import { FormControlLabel, Switch } from "@mui/material";
import { useEffect } from 'react';

export const CheckAllowsToppings = ({ allowsToppings, setAllowsToppings }: { allowsToppings: boolean, setAllowsToppings: (allowsToppings: boolean) => void }) => {
  useEffect(() => {
    console.log("set💛", allowsToppings);
    console.log("checked:", allowsToppings);


  })
  return (
    <FormControlLabel
      label="Permite Agregados"
      control={
        <Switch
          checked={allowsToppings}
          onChange={(event) => setAllowsToppings(event.target.checked)}
        />
      }
      style={{ fontSize: "0.8rem", color: `${allowsToppings ? "green" : "gray"}`, fontWeight: "bold" }}
    />


  );
}