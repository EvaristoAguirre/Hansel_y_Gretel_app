import { Checkbox, FormControlLabel, Switch } from "@mui/material";

export const CheckAllowsToppings = ({ allowsToppings, setAllowsToppings }: { allowsToppings: boolean, setAllowsToppings: (value: boolean) => void }) => {
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