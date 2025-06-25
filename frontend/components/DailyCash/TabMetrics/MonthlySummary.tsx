import SummaryCard from "./SummaryCard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useEffect, useState } from "react";
import { SummaryResponse } from "@/components/Interfaces/IMetrics";
import { getMonthlySummary } from "@/api/metrics";
const MonthlySummary = () => {
  const [data, setData] = useState<SummaryResponse>({
    ingresos: 0,
    egresos: 0,
    ganancia: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await getMonthlySummary(6, 2025);
      setData(response);
    };
    fetchData();
  }, []);

  return (
    <SummaryCard
      title="Métricas Mensuales"
      ingresos={data.ingresos}
      egresos={data.egresos}
      ganancia={data.ganancia}
      icon={<CalendarMonthIcon color="primary" />}
    />
  );
};

export default MonthlySummary;
