// client/src/pages/RelatorioPacientePage.jsx

import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    Box, Typography, TextField, List, ListItem, ListItemText, Paper, Grid, InputAdornment, 
    TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button 
} from '@mui/material';
import { Search, Print, PictureAsPdf } from '@mui/icons-material';
import axios from 'axios';
import dayjs from 'dayjs'; // Para formatar datas
import 'dayjs/locale/pt-br'; // Importar o locale pt-br
dayjs.locale('pt-br'); // Definir o locale globalmente

const API_URL = 'http://localhost:3001';

function RelatorioPacientePage() {
    const { setPageTitle } = useOutletContext();

    // Estados
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedPatientDetails, setSelectedPatientDetails] = useState(null); 
    const [atendimentoHistory, setAtendimentoHistory] = useState([]); 
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState('');

    // Efeito para definir o título
    useEffect(() => {
        setPageTitle('Relatório de Paciente');
    }, [setPageTitle]);

    // Efeito para buscar pacientes
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 2) {
                setLoading(true);
                setError('');
                // Limpa detalhes e histórico ao começar uma nova busca
                setSelectedPatientDetails(null); 
                setAtendimentoHistory([]);     
                try {
                    const response = await axios.get(`${API_URL}/pacientes?nome=${searchTerm}`);
                    setSearchResults(response.data);
                } catch (err) { 
                    console.error('Erro:', err); 
                    setSearchResults([]); 
                    setError('Erro ao buscar pacientes.'); 
                } finally { 
                    setLoading(false); 
                }
            } else { 
                setSearchResults([]); 
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Função para buscar os detalhes E o histórico quando um paciente é selecionado
    const handleSelectPatient = async (paciente) => {
        setSearchTerm(paciente.nome_completo);
        setSearchResults([]);
        setLoading(true);
        setError('');
        setSelectedPatientDetails(null);
        setAtendimentoHistory([]);

        try {
            const detailsResponse = await axios.get(`${API_URL}/pacientes/${paciente.id}`);
            setSelectedPatientDetails(detailsResponse.data);

            const historyResponse = await axios.get(`${API_URL}/atendimentos/paciente/${paciente.id}`);
            setAtendimentoHistory(historyResponse.data);

        } catch (err) {
            console.error('Erro ao buscar dados do paciente:', err);
            setError('Erro ao carregar dados completos do paciente.');
        } finally {
            setLoading(false);
        }
    };

    // Função placeholders para os botões (implementação futura)
    const handlePrint = () => {
        alert('Funcionalidade de imprimir ainda não implementada.');
    };

    const handleExportPdf = () => {
        alert('Funcionalidade de exportar PDF ainda não implementada.');
    };

    return (
        <Box  className="agendar-consulta-container"  > {/* Adiciona um padding geral à página, como no design */}
            {/* --- Seção de Busca --- */}
            <Paper sx={{ p: 3, mb: 3 }}> {/* Ajustei o padding e margin-bottom */}
                <Typography variant="h6" gutterBottom>Buscar Paciente</Typography>
                <TextField
                    fullWidth
                    placeholder="Digite o nome do paciente..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: ( <InputAdornment position="start"> <Search sx={{ color: 'action.active' }} /> </InputAdornment> ), // Cor do ícone
                    }}
                />
                {searchResults.length > 0 && (
                    <List sx={{ bgcolor: 'background.paper', mt: 1, border: '1px solid #ddd', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}>
                        {searchResults.map((paciente) => (
                            <ListItem button key={paciente.id} onClick={() => handleSelectPatient(paciente)}>
                                <ListItemText primary={paciente.nome_completo} />
                            </ListItem>
                        ))}
                    </List>
                )}
                 {loading && <Typography sx={{mt: 1, color: 'text.secondary'}}>Carregando...</Typography>}
                 {error && <Typography color="error" sx={{mt: 1}}>{error}</Typography>}
            </Paper>

            {/* --- Seção de Dados do Paciente (só mostra se um paciente for selecionado) --- */}
            {selectedPatientDetails && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Dados do Paciente</Typography>
                    <Grid container spacing={2}>
                        {/* Linha 1 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Nome Completo</Typography>
                            <Typography variant="body1">{selectedPatientDetails.nome_completo || '-'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Carteirinha do Convênio</Typography>
                            <Typography variant="body1">{selectedPatientDetails.numero_carteirinha || '-'}</Typography>
                        </Grid>
                        {/* Linha 2 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Convênio Médico</Typography>
                            <Typography variant="body1">{selectedPatientDetails.nome_convenio || 'Particular'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Profissão</Typography>
                            <Typography variant="body1">{selectedPatientDetails.profissao || '-'}</Typography>
                        </Grid>
                        {/* Linha 3 (ocupa a largura total) */}
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Problema Relatado</Typography>
                            <Typography variant="body1">{selectedPatientDetails.descricao_problema || '-'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* --- Seção Histórico de Atendimentos (só mostra se tiver detalhes do paciente) --- */}
            {selectedPatientDetails && (
                 <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Histórico de Atendimentos</Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell> {/* Negrito no cabeçalho */}
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Observações</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {atendimentoHistory.length > 0 ? (
                                    atendimentoHistory.map((atendimento) => (
                                        <TableRow key={atendimento.atendimento_id}>
                                            <TableCell>{dayjs(atendimento.data_atendimento).format('DD/MM/YYYY')}</TableCell>
                                            <TableCell>{atendimento.tipo_consulta || '-'}</TableCell>
                                            {/* Priorizamos evolucao_clinica, mas pode ser procedimentos_realizados */}
                                            <TableCell>{atendimento.evolucao_clinica || atendimento.procedimentos_realizados || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>Nenhum atendimento registrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {/* Botões de Exportar */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button 
                            variant="outlined" 
                            startIcon={<Print />} 
                            onClick={handlePrint}
                            sx={{
                                color: 'primary.main', // Cor do texto do botão
                                borderColor: 'primary.main', // Cor da borda
                                '&:hover': {
                                    borderColor: 'primary.dark', // Escurece borda no hover
                                }
                            }}
                        >
                            Imprimir
                        </Button>
                        <Button 
                            variant="contained" 
                            startIcon={<PictureAsPdf />} 
                            onClick={handleExportPdf}
                            sx={{
                                backgroundColor: '#202938', // Fundo azul escuro personalizado
                                '&:hover': {
                                    backgroundColor: '#303f53', // Fundo um pouco mais claro no hover
                                }
                            }}
                        >
                            Exportar PDF
                        </Button>
                    </Box>
                 </Paper>
            )}
        </Box>
    );
}

export default RelatorioPacientePage;