// client/src/pages/CadastroUsuarioPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Button, Container, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// O endereço base da sua API
const API_URL = 'http://localhost:3001';

function CadastroUsuarioPage() {
    // Estado para guardar todos os dados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        registro_profissional: '',
        especialidade: ''
    });

    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Função para lidar com a mudança em qualquer campo
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Função para enviar os dados para o backend
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        // Validação simples
        if (!formData.nome || !formData.email || !formData.senha || !formData.registro_profissional || !formData.especialidade) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        try {
            // Chama a rota que cria um USUÁRIO + PROFISSIONAL
            await axios.post(`${API_URL}/usuarios/profissionais`, formData);
            
            showSnackbar('Profissional cadastrado com sucesso! Redirecionando para o login...', 'success');
            
            setFormData({ nome: '', email: '', senha: '', registro_profissional: '', especialidade: '' });
            setError('');

            // Redireciona para a página de login após 2 segundos
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Ocorreu um erro ao cadastrar.';
            showSnackbar(errorMessage, 'error');
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h4">
                    Cadastrar Novo Profissional (Usuário)
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    {/* Campos para a tabela 'usuarios' */}
                    <TextField
                        name="nome"
                        label="Nome Completo"
                        value={formData.nome}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />
                    <TextField
                        name="email"
                        label="Endereço de Email (Login)"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />
                    <TextField
                        name="senha"
                        label="Senha"
                        type="password"
                        value={formData.senha}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />
                    {/* Campos para a tabela 'profissionais' */}
                    <TextField
                        name="registro_profissional"
                        label="Registro Profissional (Ex: CREFITO)"
                        value={formData.registro_profissional}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />
                    <TextField
                        name="especialidade"
                        label="Especialidade"
                        value={formData.especialidade}
                        onChange={handleChange}
                        fullWidth
                        required
                        margin="normal"
                    />

                    {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Cadastrar
                    </Button>
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default CadastroUsuarioPage;