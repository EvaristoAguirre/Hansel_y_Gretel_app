'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import Image from 'next/image';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    rol: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulario enviado:', formData);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="100vh" bgcolor="black" p={3}>
        <Card sx={{ display: 'flex', borderRadius: 2, boxShadow: 3, maxWidth: 600, mt: 4 }}>
          {/* Sección del logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', p: 3, borderRadius: '8px 0 0 8px' }}>
            <Image src="/logo.svg" alt="Logo" width={150} height={150} />
          </Box>
          {/* Sección del formulario */}
          <CardContent sx={{ flex: 1, p: 4 }}>
            <Typography variant="h5" fontWeight={700} textAlign="center" color="primary.main" gutterBottom>
              Registro
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label="Nombre"
                variant="outlined"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Rol"
                variant="outlined"
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                variant="outlined"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Contraseña"
                variant="outlined"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, color: 'primary.main', bgcolor: 'secondary.main', ':hover': { bgcolor: '#e6a826', color: 'black' } }}
              >
                Registrarse
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
