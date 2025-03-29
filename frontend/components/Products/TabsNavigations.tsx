import React from "react";
import { AppBar, Tabs, Tab } from "@mui/material";

interface TabsNavigationProps {
  tabIndex: number;
  tabs: string[];
  onChange: (event: React.SyntheticEvent, newIndex: number) => void;

}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  tabIndex,
  tabs,
  onChange
}) => (
  <AppBar
    position="static"
    sx={{
      backgroundColor: "#f3d49ab8", mt: 11, pt: 2, color: "black",
      gap: 4, borderBottom: "2px solid #f9b32d", boxShadow: "none"
    }}
  >
    <Tabs
      value={tabIndex}
      textColor="inherit"
      sx={{
        "& .MuiTab-root": {
          fontWeight: "bold !important" as any,
          width: "auto",
          flex: 1,
        },
        "& .MuiTab-root.Mui-selected": {
          color: "white !important",
          backgroundColor: "var(--color-primary)!important",
        },

      }}
      onChange={onChange}
    >
      {tabs.map((label, index) => (
        <Tab key={index} label={label} />
      ))}
    </Tabs>
  </AppBar>
);
