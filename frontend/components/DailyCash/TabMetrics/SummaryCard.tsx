import { Box, Card, CardContent, Typography, Stack } from "@mui/material";

interface SummaryCardProps {
  income: number;
  expenses: number;
  profit: number;
  icon?: React.ReactNode;
  title: string;
}

const SummaryCard = ({ title, income, expenses, profit, icon }: SummaryCardProps) => {
  const formatCurrency = (value?: number) =>
    typeof value === "number"
      ? `$ ${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`
      : "$ 0.00";

  return (
    <Card elevation={3} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          {icon}
          <Typography variant="h6">{title}</Typography>
        </Stack>

        <Box
          sx={{
            backgroundColor: "secondary.light",
            borderRadius: 2,
            px: 2,
            py: 1,
            mb: 1,
          }}
        >
          <Typography>Ingresos</Typography>
          <Typography fontWeight="bold">{formatCurrency(income)}</Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: "primary.light",
            backgroundOpacity: 0.1,
            borderRadius: 2,
            px: 2,
            py: 1,
            mb: 1,
          }}
        >
          <Typography>Egresos</Typography>
          <Typography fontWeight="bold">
            {isNaN(expenses) ? "NaN" : formatCurrency(expenses)}
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: "secondary.dark",
            borderRadius: 2,
            px: 2,
            py: 1,
          }}
        >
          <Typography>Ganancia</Typography>
          <Typography fontWeight="bold">{formatCurrency(profit)}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
