// client/src/pages/RegistrarAtendimentoPage.jsx

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    Box, Typography, TextField, List, ListItem, ListItemButton, ListItemText, Paper, 
    Grid, InputAdornment, Button, Alert, CircularProgress, Snackbar 
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs';

const API_URL = 'http://localhost:3001';

function RegistrarAtendimentoPage() {
    const { setPageTitle } = useOutletContext();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null); // Paciente selecionado
    const [patientAppointments, setPatientAppointments] = useState([]); // Agendamentos do paciente
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null); // ID do agendamento a ser registrado
    const [evolucaoClinica, setEvolucaoClinica] = useState('');
    const [procedimentosRealizados, setProcedimentosRealizados] = useState('');
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [error, setError] = useState('');
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

    // Efeito para o título
    useEffect(() => {
        setPageTitle('Registrar Atendimento (Novo Prontuário)');
    }, [setPageTitle]);

    // Efeito para buscar pacientes
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm && searchTerm.trim().length >= 4) {
                setLoadingSearch(true);
                setError('');
                setSelectedPatient(null); // Limpa seleção ao buscar de novo
                setPatientAppointments([]);
                setSelectedAppointmentId(null);
                try {
                    const response = await axios.get(`${API_URL}/pacientes?nome=${searchTerm}`);
                    setSearchResults(response.data);
                } catch (err) { console.error('Erro busca:', err); setSearchResults([]); setError('Erro ao buscar pacientes.'); } 
                finally { setLoadingSearch(false); }
            } else { setSearchResults([]); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Função para quando um paciente é selecionado
    const handleSelectPatient = async (paciente) => {
        setSelectedPatient(paciente);
        setSearchTerm(paciente.nome_completo);
        setSearchResults([]);
        setLoadingAppointments(true);
        setError('');
        setPatientAppointments([]);
        setSelectedAppointmentId(null); // Limpa seleção de agendamento

        try {
            // Busca os agendamentos do paciente que ainda não têm prontuário
            const response = await axios.get(`${API_URL}/agendamentos`, {
                params: { pacienteId: paciente.id, semAtendimento: true }
            });
            
            // Filtrar agendamentos cancelados E agendamentos futuros (só mostra do passado)
            const agora = dayjs();
            const agendamentosValidos = response.data.filter(ag => 
                ag.status !== 'Cancelado' && dayjs(ag.data_hora).isBefore(agora)
            );
            setPatientAppointments(agendamentosValidos);

        } catch (err) {
            console.error('Erro ao buscar agendamentos do paciente:', err);
            setError('Erro ao buscar agendamentos do paciente.');
        } finally {
            setLoadingAppointments(false);
        }
    };
    
    // Função para quando um agendamento é selecionado
    const handleSelectAppointment = (agendamentoId) => {
        setSelectedAppointmentId(agendamentoId);
        // Limpa mensagens anteriores
        setError('');
    };

    // Função para salvar o atendimento
    const handleSaveAtendimento = async (event) => {
        event.preventDefault();
        if (!selectedAppointmentId) {
            setError('Por favor, selecione um agendamento para registrar.');
            return;
        }
        if (!evolucaoClinica && !procedimentosRealizados) {
             setError('Preencha a Evolução Clínica ou os Procedimentos Realizados.');
            return;
        }

        setLoadingSubmit(true);
        setError('');

        const atendimentoData = {
            agendamento_id: selectedAppointmentId,
            evolucao_clinica: evolucaoClinica,
            procedimentos_realizados: procedimentosRealizados
        };

        try {
            // Chama a rota POST /atendimentos que já existe no backend
            await axios.post(`${API_URL}/atendimentos`, atendimentoData);
            showSnackbar('Atendimento registrado com sucesso!', 'success');
            
            // Limpa os campos após salvar
            setEvolucaoClinica('');
            setProcedimentosRealizados('');
            setSelectedAppointmentId(null);
            setError('');
            
            // Atualiza a lista de agendamentos para remover o que foi registrado
            if (selectedPatient) {
                const response = await axios.get(`${API_URL}/agendamentos`, {
                    params: { pacienteId: selectedPatient.id, semAtendimento: true }
                });
                
                // Filtrar agendamentos cancelados E agendamentos futuros (só mostra do passado)
                const agora = dayjs();
                const agendamentosValidos = response.data.filter(ag => 
                    ag.status !== 'Cancelado' && dayjs(ag.data_hora).isBefore(agora)
                );
                setPatientAppointments(agendamentosValidos);
            }

        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Erro ao registrar atendimento.', 'error');
        } finally {
            setLoadingSubmit(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSaveAtendimento}>
            {/* --- Seção de Busca de Paciente --- */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>1. Selecione o Paciente</Typography>
                <TextField
                    fullWidth
                    placeholder="Digite o nome do paciente..."
                    variant="outlined" size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: ( <InputAdornment position="start"> <Search/> </InputAdornment> ), }}
                />
                {searchResults.length > 0 && (
                    <List sx={{ bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}>
                        {searchResults.map((p) => (
                            <ListItemButton key={p.id} onClick={() => handleSelectPatient(p)}>
                                <ListItemText primary={p.nome_completo} />
                            </ListItemButton>
                        ))}
                    </List>
                )}
                {loadingSearch && <CircularProgress size={20} sx={{mt: 1}}/>}
            </Paper>

            {/* --- Seção de Seleção de Agendamento --- */}
            {selectedPatient && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>2. Selecione o Agendamento a Registrar</Typography>
                    {loadingAppointments && <CircularProgress size={20} />}
                    {!loadingAppointments && patientAppointments.length === 0 && (
                        <Typography color="textSecondary">Nenhum agendamento encontrado para {selectedPatient.nome_completo}.</Typography>
                    )}
                    {!loadingAppointments && patientAppointments.length > 0 && (
                         <List dense sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #eee', borderRadius: 1}}>
                            {patientAppointments.map((ag) => (
                                <ListItemButton 
                                    key={ag.id} 
                                    onClick={() => handleSelectAppointment(ag.id)}
                                    selected={selectedAppointmentId === ag.id} // Destaca o selecionado
                                >
                                    <ListItemText 
                                        primary={`${dayjs(ag.data_hora).format('DD/MM/YYYY HH:mm')}`} 
                                        secondary={ag.tipo_consulta || 'Consulta'} 
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Paper>
            )}

            {/* --- Seção de Registro Clínico --- */}
            {selectedAppointmentId && ( // Só mostra se um agendamento for selecionado
                 <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>3. Registro Clínico</Typography>
                    <TextField
                        label="Evolução Clínica"
                        multiline rows={4}
                        fullWidth
                        value={evolucaoClinica}
                        onChange={(e) => setEvolucaoClinica(e.target.value)}
                        margin="normal"
                    />
                     <TextField
                        label="Procedimentos Realizados"
                        multiline rows={4}
                        fullWidth
                        value={procedimentosRealizados}
                        onChange={(e) => setProcedimentosRealizados(e.target.value)}
                        margin="normal"
                    />
                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="contained" disabled={loadingSubmit}>
                            {loadingSubmit ? <CircularProgress size={24} color="inherit" /> : 'Salvar Atendimento'}
                        </Button>
                    </Box>
                 </Paper>
            )}

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
        </Box>
    );
}

export default RegistrarAtendimentoPage;