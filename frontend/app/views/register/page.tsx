'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, TextField, Button, Box, MenuItem } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/styles/theme';
import Image from 'next/image';
import { registerUser } from '@/helpers/login-register';
import { RegisterRequest } from '@/components/Interfaces/IUsers';
import Swal from 'sweetalert2';
import { UserRole } from '@/components/Enums/user';

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    password: '',
    role: UserRole.MOZO, // Valor por defecto
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Si el campo es 'role', convertirlo a enum
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'role' ? (value as UserRole) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await registerUser(formData);
      Swal.fire('Registro exitoso', 'El usuario se ha registrado correctamente', 'success');
      // redirigir a la vista de login
      window.location.href = '/views/login';
    } catch (error: any) {
      console.error('Error en el registro:', error.message);
      Swal.fire('Error en el registro', error.message, 'error');
    }
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
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                select
                margin="normal"
                label="Rol"
                variant="outlined"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <MenuItem value={UserRole.MOZO}>Mozo</MenuItem>
                <MenuItem value={UserRole.ENCARGADO}>Encargado</MenuItem>
                <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              </TextField>
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
