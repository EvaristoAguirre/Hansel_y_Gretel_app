import { Box, Chip, IconButton, Grid, Tooltip } from '@mui/material';
import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { ITopping } from "@/components/Interfaces/IToppings";
import { capitalizeFirstLetter } from "./CapitalizeFirstLetter";
import { AutoAwesome } from "@mui/icons-material";

interface Props {
  toppings: ITopping[];
  maxPerPage?: number;
}

const ScrollableChips = ({ toppings, maxPerPage = 4 }: Props) => {
  const [page, setPage] = useState(0);

  const pages = [];
  for (let i = 0; i < toppings.length; i += maxPerPage) {
    pages.push(toppings.slice(i, i + maxPerPage));
  }

  const currentPage = pages[page];

  const handlePrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNext = () => {
    if (page < pages.length - 1) setPage(page + 1);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",

        }}>
        <IconButton size="small" onClick={handlePrev} disabled={page === 0}>
          <ChevronLeftIcon />
        </IconButton>

        <Grid
          container
          spacing={1}
          columns={2}
          sx={{
            width: "90%",
            px: 1,
            minHeight: 80,
            alignContent: "flex-start",
          }}
        >
          {currentPage.map((topping) => (
            <Grid
              item
              xs={1}
              key={topping.id}
              sx={{
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              <Chip
                label={capitalizeFirstLetter(topping.name)}
                icon={<AutoAwesome />}
                color="primary"
                variant="outlined"
                sx={{
                  width: "100%",
                  minWidth: 100,
                  fontSize: "0.875rem",
                  py: 0.5,
                }}
              />
            </Grid>
          ))}
        </Grid>

        <IconButton
          size="small"
          onClick={handleNext}
          disabled={page === pages.length - 1}
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        {pages.map((_, idx) => (
          <Box
            key={idx}
            onClick={() => setPage(idx)}
            sx={{
              width: page === idx ? 8 : 6,
              height: page === idx ? 8 : 6,
              borderRadius: "50%",
              bgcolor: page === idx ? "primary.main" : "grey.400",
              cursor: "pointer",
              transition: "all 0.3s",
              mt: 2
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ScrollableChips;