// client/src/pages/CadastroUsuarioPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Button, Container, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// O endereço base da sua API
const API_URL = 'http://localhost:3001';

function CadastroUsuarioPage() {
    // 1. Um único estado para guardar todos os dados do formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        registro_profissional: '',
        especialidade: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    // 2. Uma função única para lidar com a mudança em qualquer campo de texto
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // 3. Função para enviar os dados para o backend ao submeter o formulário
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        // Validação simples para ver se todos os campos estão preenchidos
        if (!formData.nome || !formData.email || !formData.senha || !formData.registro_profissional || !formData.especialidade) {
            setError('Todos os campos são obrigatórios.');
            return;
        }

        try {
            // A chamada para a rota que criamos no backend
            await axios.post(`${API_URL}/usuarios/profissionais`, formData);
            
            setSuccess('Profissional cadastrado com sucesso! Redirecionando para o login...');
            
            // Limpa o formulário após o sucesso
            setFormData({ nome: '', email: '', senha: '', registro_profissional: '', especialidade: '' });

            // Redireciona para a página de login após 2 segundos
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            // Pega a mensagem de erro do backend, se houver, ou mostra uma genérica
            const errorMessage = err.response?.data?.error || 'Ocorreu um erro ao cadastrar.';
            setError(errorMessage);
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
                    Cadastrar Novo Profissional
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
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
                        label="Endereço de Email"
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
                    {success && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{success}</Alert>}

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
        </Container>
    );
}

export default CadastroUsuarioPage;