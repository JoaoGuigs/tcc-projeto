import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const ConfiguracoesPage = () => {
  const { setPageTitle } = useOutletContext();
  const [clinicData, setClinicData] = useState({
    nome_clinica: '',
    cnpj: '',
    telefone: '',
    email: '',
  });
  const [convenios, setConvenios] = useState([]);
  const [mensagensPadrao, setMensagensPadrao] = useState([
    {
      id: 1,
      titulo: 'Lembrete de Consulta',
      mensagem: 'Olá [nome], lembrando sua consulta amanhã às [horario]. Por favor, confirme sua presença. Atenciosamente, Clínica FisioSaúde.',
    },
    {
      id: 2,
      titulo: 'Confirmação de Agendamento',
      mensagem: 'Olá [nome], sua consulta foi agendada para [data] às [horario]. Aguardamos você! Clínica FisioSaúde.',
    },
  ]);

  const [openConvenioDialog, setOpenConvenioDialog] = useState(false);
  const [openMensagemDialog, setOpenMensagemDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [convenioToDelete, setConvenioToDelete] = useState(null);
  const [novoConvenio, setNovoConvenio] = useState('');
  const [novaMensagem, setNovaMensagem] = useState({
    titulo: '',
    mensagem: '',
  });
  
  // Estados para notificações
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });

  useEffect(() => {
    setPageTitle('Configurações do Sistema');
    fetchClinicData();
    fetchConvenios();
  }, [setPageTitle]);

  const fetchClinicData = async () => {
    try {
      const response = await axios.get(`${API_URL}/configuracoes/clinica`);
      setClinicData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados da clínica:', error);
    }
  };

  const fetchConvenios = async () => {
    try {
      const response = await axios.get(`${API_URL}/convenios`);
      setConvenios(response.data);
    } catch (error) {
      console.error('Erro ao carregar convênios:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleAddConvenio = async () => {
    if (!novoConvenio.trim()) {
      showSnackbar('Por favor, digite o nome do convênio', 'warning');
      return;
    }
    
    try {
      await axios.post(`${API_URL}/convenios`, { nome_convenio: novoConvenio });
      fetchConvenios();
      setNovoConvenio('');
      setOpenConvenioDialog(false);
      showSnackbar('Convênio adicionado com sucesso!', 'success');
    } catch (error) {
      showSnackbar('Erro ao adicionar convênio', 'error');
    }
  };

  const handleOpenDeleteDialog = (convenio) => {
    setConvenioToDelete(convenio);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setConvenioToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!convenioToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/convenios/${convenioToDelete.id}`);
      fetchConvenios();
      handleCloseDeleteDialog();
      showSnackbar('Convênio excluído com sucesso!', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao excluir convênio';
      handleCloseDeleteDialog();
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleAddMensagem = () => {
    if (!novaMensagem.titulo || !novaMensagem.mensagem) {
      showSnackbar('Por favor, preencha todos os campos', 'warning');
      return;
    }
    
    setMensagensPadrao(prev => [...prev, {
      id: Date.now(),
      ...novaMensagem
    }]);
    setNovaMensagem({ titulo: '', mensagem: '' });
    setOpenMensagemDialog(false);
    showSnackbar('Mensagem adicionada com sucesso!', 'success');
  };

  return (
    <Box sx={{ padding: "32px 48px", width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: "900px", width: "100%" }}>
        {/* Dados da Clínica */}
        <Paper
          sx={{
            p: 3,
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f0f0f0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#2c3e50",
                }}
              />
              <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>
                Dados da Clínica
              </Typography>
            </Box>
            <IconButton size="small">
              <EditIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: "12px", mb: 0.5, display: "block" }}>
                  Nome da Clínica
                </Typography>
                <Typography sx={{ fontSize: "15px", fontWeight: 500 }}>
                  {clinicData.nome_clinica || "Clínica FisioSaúde"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: "12px", mb: 0.5, display: "block" }}>
                  CNPJ
                </Typography>
                <Typography sx={{ fontSize: "15px", fontWeight: 500 }}>
                  {clinicData.cnpj || "12.345.678/0001-90"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: "12px", mb: 0.5, display: "block" }}>
                  Telefone
                </Typography>
                <Typography sx={{ fontSize: "15px", fontWeight: 500 }}>
                  {clinicData.telefone || "(11) 3456-7890"}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="caption" sx={{ color: "#666", fontSize: "12px", mb: 0.5, display: "block" }}>
                  Email
                </Typography>
                <Typography sx={{ fontSize: "15px", fontWeight: 500 }}>
                  {clinicData.email || "contato@fisiosaude.com"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Convênios Aceitos */}
        <Paper
          sx={{
            p: 3,
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f0f0f0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#2c3e50",
                }}
              />
              <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>
                Convênios Aceitos
              </Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setOpenConvenioDialog(true)}
              sx={{
                backgroundColor: "#2c3e50",
                color: "#fff",
                textTransform: "none",
                fontSize: "13px",
                borderRadius: "6px",
                padding: "6px 16px",
                "&:hover": {
                  backgroundColor: "#1a252f",
                },
              }}
            >
              Adicionar
            </Button>
          </Box>

          <List sx={{ p: 0 }}>
            {convenios.map((convenio, index) => (
              <ListItem
                key={convenio.id}
                sx={{
                  px: 0,
                  py: 1.5,
                  borderBottom: index < convenios.length - 1 ? "1px solid #f0f0f0" : "none",
                }}
              >
                <ListItemText
                  primary={convenio.nome_convenio}
                  primaryTypographyProps={{
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleOpenDeleteDialog(convenio)}
                    size="small"
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {convenios.length === 0 && (
              <Typography sx={{ color: "#999", fontSize: "14px", py: 2, textAlign: "center" }}>
                Nenhum convênio cadastrado
              </Typography>
            )}
          </List>
        </Paper>

        {/* Mensagens Padrão */}
        <Paper
          sx={{
            p: 3,
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f0f0f0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#2c3e50",
                }}
              />
              <Typography variant="h6" sx={{ fontSize: "16px", fontWeight: 600 }}>
                Mensagens Padrão
              </Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setOpenMensagemDialog(true)}
              sx={{
                backgroundColor: "#2c3e50",
                color: "#fff",
                textTransform: "none",
                fontSize: "13px",
                borderRadius: "6px",
                padding: "6px 16px",
                "&:hover": {
                  backgroundColor: "#1a252f",
                },
              }}
            >
              Nova Mensagem
            </Button>
          </Box>

          <List sx={{ p: 0 }}>
            {mensagensPadrao.map((msg, index) => (
              <ListItem
                key={msg.id}
                sx={{
                  px: 0,
                  py: 2,
                  borderBottom: index < mensagensPadrao.length - 1 ? "1px solid #f0f0f0" : "none",
                  alignItems: "flex-start",
                }}
              >
                <ListItemText
                  primary={msg.titulo}
                  secondary={msg.mensagem}
                  primaryTypographyProps={{
                    fontSize: "14px",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                  secondaryTypographyProps={{
                    fontSize: "13px",
                    color: "#666",
                    sx: {
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    },
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small">
                    <EditIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      {/* Dialog para adicionar convênio */}
      <Dialog 
        open={openConvenioDialog} 
        onClose={() => setOpenConvenioDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: "12px",
          }
        }}
      >
        <DialogTitle sx={{ fontSize: "18px", fontWeight: 600 }}>
          Adicionar Convênio
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Convênio"
            fullWidth
            value={novoConvenio}
            onChange={(e) => setNovoConvenio(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddConvenio();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={() => setOpenConvenioDialog(false)}
            sx={{
              color: "#666",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddConvenio} 
            variant="contained"
            sx={{
              backgroundColor: "#2c3e50",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#1a252f",
              },
            }}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para adicionar mensagem padrão */}
      <Dialog
        open={openMensagemDialog}
        onClose={() => setOpenMensagemDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "12px",
          }
        }}
      >
        <DialogTitle sx={{ fontSize: "18px", fontWeight: 600 }}>
          Nova Mensagem Padrão
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Título da Mensagem"
            fullWidth
            value={novaMensagem.titulo}
            onChange={(e) => setNovaMensagem(prev => ({ ...prev, titulo: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Texto da Mensagem"
            fullWidth
            multiline
            rows={4}
            value={novaMensagem.mensagem}
            onChange={(e) => setNovaMensagem(prev => ({ ...prev, mensagem: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={() => setOpenMensagemDialog(false)}
            sx={{
              color: "#666",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddMensagem} 
            variant="contained"
            sx={{
              backgroundColor: "#2c3e50",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#1a252f",
              },
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            padding: "8px",
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "#fff3e0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WarningAmberIcon sx={{ color: "#f57c00", fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontSize: "18px", fontWeight: 600 }}>
            Excluir Convênio
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#666", fontSize: "15px" }}>
            Tem certeza que deseja excluir o convênio{" "}
            <strong>{convenioToDelete?.nome_convenio}</strong>?
          </Typography>
          <Typography sx={{ color: "#999", fontSize: "13px", mt: 1 }}>
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{
              color: "#666",
              textTransform: "none",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              backgroundColor: "#d32f2f",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#b71c1c",
              },
            }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfiguracoesPage;