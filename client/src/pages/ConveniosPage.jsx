// client/src/pages/ConveniosPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText } from '@mui/material';

// O endereço base da sua API
const API_URL = 'http://localhost:3001';

function ConveniosPage() {
    // 1. Estados para controlar o formulário e a lista
    const [convenios, setConvenios] = useState([]); // Guarda a lista de convênios do banco
    const [nomeConvenio, setNomeConvenio] = useState(''); // Guarda o que o usuário digita no campo

    // 2. Função para buscar os convênios no backend
    const fetchConvenios = async () => {
        try {
            const response = await axios.get(`${API_URL}/convenios`);
            setConvenios(response.data);
        } catch (error) {
            console.error('Erro ao buscar convênios:', error);
        }
    };

    // 3. useEffect para buscar os dados assim que a página carregar
    useEffect(() => {
        fetchConvenios();
    }, []);

    // 4. Função para ENVIAR o novo convênio para o backend
    const handleSaveConvenio = async (event) => {
        event.preventDefault(); // Impede o recarregamento padrão do formulário
        
        try {
            // Este objeto é o que se tornará o 'req.body' no backend
            const novoConvenioData = {
                nome_convenio: nomeConvenio // A chave 'nome_convenio' DEVE ser igual à que o backend espera
            };

            // Faz a chamada POST para a rota que criamos
            await axios.post(`${API_URL}/convenios`, novoConvenioData);

            alert('Convênio salvo com sucesso!');
            setNomeConvenio(''); // Limpa o campo de texto
            fetchConvenios(); // Atualiza a lista na tela

        } catch (error) {
            console.error('Erro ao salvar convênio:', error);
            alert('Erro ao salvar convênio.');
        }
    };


    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Gerenciar Convênios
            </Typography>

            {/* Formulário de Cadastro */}
            <Box component="form" onSubmit={handleSaveConvenio} sx={{ mb: 4 }}>
                <TextField
                    label="Nome do Novo Convênio"
                    variant="outlined"
                    fullWidth
                    value={nomeConvenio}
                    onChange={(e) => setNomeConvenio(e.target.value)} // Atualiza o estado a cada letra digitada
                    sx={{ mb: 2 }}
                />
                <Button type="submit" variant="contained">
                    Salvar Novo Convênio
                </Button>
            </Box>

            {/* Lista de Convênios Existentes */}
            <Typography variant="h5">
                Convênios Cadastrados
            </Typography>
            <List sx={{ bgcolor: 'background.paper' }}>
                {convenios.map((convenio) => (
                    <ListItem key={convenio.id}>
                        <ListItemText primary={convenio.nome_convenio} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

export default ConveniosPage;