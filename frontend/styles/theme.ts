'use client';
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#856D5E",
      light: "9d8a7e",
      dark: "#5d4c41",
    },
    secondary: {
      main: "#f9b32d",
      light: "#f3d49a",
    },
    background: {
      default: "#c0afa2",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#757575",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
  },
});

export default theme;
