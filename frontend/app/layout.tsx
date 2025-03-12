import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "@/styles/theme";
import { AuthProvider } from "./context/authContext";
import Footer from "@/components/Footer/Footer";

export const metadata: Metadata = {
  title: "Hansel&Gretel App",
  description: "Aplicación de gestión interna de mesas, ordenes, stock y roles de usuarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className=""
      >
        <AuthProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Navbar />
            {children}
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
