import SummaryCard from "./SummaryCard";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useEffect, useState } from "react";
import { SummaryResponse } from "@/components/Interfaces/IMetrics";
import { getAnnualSummary } from "@/api/metrics";

const AnnualSummary = () => {
  const [data, setData] = useState<SummaryResponse>({
    ingresos: 0,
    egresos: 0,
    ganancia: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await getAnnualSummary(2025);
      setData(response);
    };
    fetchData();
  }, []);

  return (
    <SummaryCard
      title="Métricas Anuales"
      ingresos={data.ingresos}
      egresos={data.egresos}
      ganancia={data.ganancia}
      icon={<CalendarTodayIcon color="primary" />}
    />
  );
};

export default AnnualSummary;
