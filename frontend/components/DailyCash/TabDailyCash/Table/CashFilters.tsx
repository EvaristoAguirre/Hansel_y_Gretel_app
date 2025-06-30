import { FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";

interface Props {
  month: number;
  year: number;
  setMonth: (value: number) => void;
  setYear: (value: number) => void;
}

const CashFilters = ({ month, year, setMonth, setYear }: Props) => {
  return (
    <Stack direction="row" spacing={2} mt={3} mb={2}>
      <FormControl>
        <InputLabel>Mes</InputLabel>
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} label="Mes" size="small">
          {Array.from({ length: 12 }, (_, i) => (
            <MenuItem key={i} value={i + 1}>
              {new Date(0, i).toLocaleString("es-AR", { month: "long" })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <InputLabel>Año</InputLabel>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} label="Año" size="small">
          {[2023, 2024, 2025].map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default CashFilters;
