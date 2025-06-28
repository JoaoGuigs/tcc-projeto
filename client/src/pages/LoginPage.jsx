// Dentro de /client/src/pages/LoginPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Container, Box, Typography, TextField, Button, Avatar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    console.log('Tentando fazer login com:', { email, senha });

try{
    const response = await axios.post('http://localhost:3001/usuarios/login',{
      email: email,
      senha: senha
    })
    console.log('Resposta do servidor:', response.data);
} catch(error){
    console.error('Erro ao fazer login:', error);
  };
};
  return (
    <Box
      sx={{
        // CORREÇÃO 1: Usar '100vh' para ocupar a tela inteira
        height: '100vh', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fb', 
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            // AJUSTE: Removido o 'marginTop' para permitir a centralização perfeita
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // Sugestões de estilo para um visual de "card"
            padding: '32px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            backgroundColor: 'white',
          }}
         >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>

          <Typography component="h1" variant="h4">
            Login
          </Typography>
                    <Typography component="h1" variant="h6" sx={{
            mt: 1,
              fontSize: '1.0rem' }}>
            Sistema de Gestão de Fisioterapias
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ 
            '& .MuiInputBase-input': {
            padding: '14px 14px', // Aumenta o padding interno dos campos de entrada
            }
             }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Endereço de Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
            
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                // Sua cor customizada está perfeita!
                backgroundColor: '#202938',
                mt: 3, mb: 2 
              }}
            >
              Entrar
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;