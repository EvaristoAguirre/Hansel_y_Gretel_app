'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import Image from 'next/image';
import { loginUser } from '@/api/login-register';
import Swal from 'sweetalert2';
import { useAuth } from '@/app/context/authContext';
import { InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const { validateUserSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword((prev) => !prev);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await loginUser(formData);
      const { accessToken } = response;
      localStorage.setItem("user", JSON.stringify({ accessToken }));
      Swal.fire({
        icon: "success",
        title: "Ingresaste con éxito!",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 1000);

      validateUserSession();

    } catch (error: any) {
      Swal.fire({
        icon: "warning",
        title: "Error al iniciar sesión",
        text: error.message === "Invalid credentials" ? "Credenciales incorrectas." : "Verifica la información ingresada"
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="black" p={3}>
        <Card sx={{ display: 'flex', borderRadius: 2, boxShadow: 3, maxWidth: 600, mt: 4 }}>
          {/* Sección del logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', p: 3, borderRadius: '8px 0 0 8px' }}>
            <Image src="/logo.svg" alt="Logo" width={150} height={150} />
          </Box>
          {/* Sección del formulario */}
          <CardContent sx={{ flex: 1, p: 4 }}>
            <Typography variant="h5" fontWeight={700} textAlign="center" color="primary.main" gutterBottom>
              Ingreso
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label="Nombre"
                variant="outlined"
                type="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Contraseña"
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, color: 'primary.main', bgcolor: 'secondary.main', ':hover': { bgcolor: '#e6a826', color: 'black' } }}
              >
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
