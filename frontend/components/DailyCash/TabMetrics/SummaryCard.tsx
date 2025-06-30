import { Box, Card, CardContent, Typography, Stack } from "@mui/material";

interface SummaryCardProps {
  title: string;
  ingresos: number;
  egresos: number;
  ganancia: number;
  icon?: React.ReactNode;
}

const SummaryCard = ({ title, ingresos, egresos, ganancia, icon }: SummaryCardProps) => {
  const formatCurrency = (value: number) =>
    `$ ${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

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
          <Typography fontWeight="bold">{formatCurrency(ingresos)}</Typography>
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
            {isNaN(egresos) ? "NaN" : formatCurrency(egresos)}
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
          <Typography fontWeight="bold">{formatCurrency(ganancia)}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
