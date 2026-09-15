// client/src/pages/HomePage.jsx

import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Paper,
  Button,
  ButtonGroup,
  Box,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Divider,
} from "@mui/material";
import {
  Search,
  PersonAdd,
  CalendarToday,
  Description,
  Today,
  DateRange,
  EventNote,
  Cancel,
} from "@mui/icons-material";
import api from "../services/api";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import "dayjs/locale/pt-br";
import "./css/HomePage.css";
import { getDateRange } from "../utils/dateRanges";
import { useQuery, useQueryClient } from "@tanstack/react-query";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("pt-br");

function HomePage() {
  // 1. Pega a função 'setPageTitle' do MainLayout para definir o título
  const { setPageTitle } = useOutletContext();

  // 2. Cria um "estado" para guardar a lista de agendamentos que vem da API
  const [agendaDoDia, setAgendaDoDia] = useState([]);
  const [agendaDoDiaOriginal, setAgendaDoDiaOriginal] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("hoje"); // 'hoje', 'semana', 'mes', 'personalizado'
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [appliedRange, setAppliedRange] = useState({ dataInicio: "", dataFim: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, agendamentoId: null });
  const queryClient = useQueryClient();
  const appointmentParams = getDateRange(viewMode, appliedRange.dataInicio, appliedRange.dataFim);
  const appointmentsQuery = useQuery({
    queryKey: ["agendamentos", appointmentParams],
    enabled: viewMode !== "personalizado" || Boolean(appliedRange.dataInicio && appliedRange.dataFim),
    queryFn: async () => (await api.get("/agendamentos", { params: appointmentParams })).data,
    select: (items) => items.filter((item) => item.status !== "Cancelado"),
  });

  useEffect(() => {
    const items = appointmentsQuery.data || [];
    setAgendaDoDia(items);
    setAgendaDoDiaOriginal(items);
  }, [appointmentsQuery.data]);

  // 3. Primeiro useEffect: Define o título da página no Header
  useEffect(() => {
    setPageTitle("Início");
  }, [setPageTitle]);


  // 5. Função para filtrar agendamentos
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === "") {
      // Se o campo estiver vazio, mostra todos
      setAgendaDoDia(agendaDoDiaOriginal);
    } else {
      // Filtra por nome do paciente (case insensitive)
      const filtered = agendaDoDiaOriginal.filter((agendamento) =>
        agendamento.paciente_nome
          ?.toLowerCase()
          .includes(term.toLowerCase())
      );
      setAgendaDoDia(filtered);
    }
  };

  // 6. Função para mudar o modo de visualização
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSearchTerm(""); // Limpa a busca ao mudar de modo
    
    if (mode === "personalizado") {
      // Define valores padrão para o período personalizado
      const hoje = dayjs().format("YYYY-MM-DD");
      const daquiUmaSemana = dayjs().add(7, "day").format("YYYY-MM-DD");
      setDataInicio(hoje);
      setDataFim(daquiUmaSemana);
    }
  };

  // 7. Função para aplicar filtro personalizado
  const handleApplyCustomFilter = () => {
    if (dataInicio && dataFim) {
      setAppliedRange({ dataInicio, dataFim });
      setViewMode("personalizado");
    }
  };

  // 8. Funções para cancelar agendamento
  const handleCancelClick = (agendamentoId) => {
    setConfirmDialog({ open: true, agendamentoId });
  };

  const handleCloseDialog = () => {
    setConfirmDialog({ open: false, agendamentoId: null });
  };

  const handleConfirmCancel = async () => {
    try {
      await api.delete(`/agendamentos/${confirmDialog.agendamentoId}`);
      setSnackbar({ open: true, message: "Agendamento cancelado com sucesso!", severity: "success" });
      
      // Remover o agendamento da lista
      setAgendaDoDia(prev => prev.filter(ag => ag.id !== confirmDialog.agendamentoId));
      setAgendaDoDiaOriginal(prev => prev.filter(ag => ag.id !== confirmDialog.agendamentoId));
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      setSnackbar({ open: true, message: "Erro ao cancelar agendamento.", severity: "error" });
      handleCloseDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 9. Função para obter o título da agenda baseado no modo
  const getAgendaTitle = () => {
    if (viewMode === "hoje") return "Agenda do Dia";
    if (viewMode === "semana") return "Agenda da Semana";
    if (viewMode === "mes") return "Agenda do Mês";
    if (viewMode === "personalizado") return "Agendamentos por Período";
    return "Agendamentos";
  };

  // 10. Função para agrupar agendamentos por dia
  const groupByDay = (agendamentos) => {
    const grupos = {};
    
    agendamentos.forEach((item) => {
      const diaKey = dayjs(item.data_hora).format("YYYY-MM-DD");
      if (!grupos[diaKey]) {
        grupos[diaKey] = [];
      }
      grupos[diaKey].push(item);
    });
    
    // Ordenar os dias
    return Object.keys(grupos)
      .sort()
      .map(diaKey => ({
        dia: diaKey,
        agendamentos: grupos[diaKey]
      }));
  };

  // 5. O JSX (visual) da sua página
  return (
    <div className="homepage-container">
      {/* Barra de busca */}
      <div className="search-container">
        <TextField
          className="search-bar"
          placeholder="Buscar paciente..."
          variant="outlined"
          size="medium"
          fullWidth
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search className="search-icon" />
              </InputAdornment>
            ),
          }}
        />
      </div>

      {/* Seção de Cards de Ação */}
      <div className="action-cards-container">
        <Card
          component={RouterLink}
          to="/pacientes/novo"
          className="action-card"
        >
          <CardContent className="action-card-content">
            <PersonAdd className="action-card-icon" />
            <span className="action-card-title">Novo Paciente</span>
          </CardContent>
        </Card>

        <Card
          component={RouterLink}
          to="/agendar"
          className="action-card"
        >
          <CardContent className="action-card-content">
            <CalendarToday className="action-card-icon" />
            <span className="action-card-title">Agendar Consulta</span>
          </CardContent>
        </Card>

        <Card
          component={RouterLink}
          to="/atendimentos/novo"
          className="action-card"
        >
          <CardContent className="action-card-content">
            <Description className="action-card-icon" />
            <span className="action-card-title">Novo Prontuário</span>
          </CardContent>
        </Card>
      </div>

      {/* Seção da Agenda do Dia */}
      <Paper className="agenda-section">
        {/* Controles de visualização */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <h5 className="agenda-title">{getAgendaTitle()}</h5>
            
            <ButtonGroup variant="outlined" size="small">
              <Button
                startIcon={<Today />}
                onClick={() => handleViewModeChange("hoje")}
                variant={viewMode === "hoje" ? "contained" : "outlined"}
                sx={{
                  backgroundColor: viewMode === "hoje" ? "#2c3e50" : "transparent",
                  color: viewMode === "hoje" ? "#fff" : "#2c3e50",
                  borderColor: "#2c3e50",
                  "&:hover": {
                    backgroundColor: viewMode === "hoje" ? "#1a252f" : "#f5f5f5",
                    borderColor: "#2c3e50",
                  },
                }}
              >
                Hoje
              </Button>
              <Button
                startIcon={<CalendarToday />}
                onClick={() => handleViewModeChange("semana")}
                variant={viewMode === "semana" ? "contained" : "outlined"}
                sx={{
                  backgroundColor: viewMode === "semana" ? "#2c3e50" : "transparent",
                  color: viewMode === "semana" ? "#fff" : "#2c3e50",
                  borderColor: "#2c3e50",
                  "&:hover": {
                    backgroundColor: viewMode === "semana" ? "#1a252f" : "#f5f5f5",
                    borderColor: "#2c3e50",
                  },
                }}
              >
                Semana
              </Button>
              <Button
                startIcon={<EventNote />}
                onClick={() => handleViewModeChange("mes")}
                variant={viewMode === "mes" ? "contained" : "outlined"}
                sx={{
                  backgroundColor: viewMode === "mes" ? "#2c3e50" : "transparent",
                  color: viewMode === "mes" ? "#fff" : "#2c3e50",
                  borderColor: "#2c3e50",
                  "&:hover": {
                    backgroundColor: viewMode === "mes" ? "#1a252f" : "#f5f5f5",
                    borderColor: "#2c3e50",
                  },
                }}
              >
                Mês
              </Button>
              <Button
                startIcon={<DateRange />}
                onClick={() => handleViewModeChange("personalizado")}
                variant={viewMode === "personalizado" ? "contained" : "outlined"}
                sx={{
                  backgroundColor: viewMode === "personalizado" ? "#2c3e50" : "transparent",
                  color: viewMode === "personalizado" ? "#fff" : "#2c3e50",
                  borderColor: "#2c3e50",
                  "&:hover": {
                    backgroundColor: viewMode === "personalizado" ? "#1a252f" : "#f5f5f5",
                    borderColor: "#2c3e50",
                  },
                }}
              >
                Período
              </Button>
            </ButtonGroup>
          </Box>

          {/* Filtros de data personalizados */}
          {viewMode === "personalizado" && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                label="Data Início"
                type="date"
                size="small"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Data Fim"
                type="date"
                size="small"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleApplyCustomFilter}
                disabled={!dataInicio || !dataFim}
                sx={{
                  backgroundColor: "#2c3e50",
                  "&:hover": { backgroundColor: "#1a252f" },
                }}
              >
                Aplicar
              </Button>
            </Box>
          )}
        </Box>

        {/* Lista de agendamentos */}
        {agendaDoDia.length === 0 ? (
          <div className="agenda-empty">
            <p>
              {searchTerm
                ? `Nenhum paciente encontrado com "${searchTerm}"`
                : "Nenhum agendamento encontrado para este período."}
            </p>
          </div>
        ) : viewMode === "hoje" ? (
          // Modo "Hoje" - sem separadores
          <div className="appointments-list">
            {agendaDoDia.map((item) => (
              <div key={item.id} className="appointment-item">
                <div className="appointment-time">
                  {dayjs(item.data_hora).format("HH:mm")}
                </div>

                <div className="appointment-avatar">
                  {item.paciente_nome?.charAt(0).toUpperCase() || "?"}
                </div>

                <div className="appointment-info">
                  <div className="appointment-patient-name">
                    {item.paciente_nome}
                  </div>
                  <div className="appointment-type">
                    {item.tipo_consulta || "Consulta Padrão"}
                  </div>
                  {item.convenio && (
                    <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>
                      {item.convenio}
                      {item.numero_carteirinha && ` - Carteirinha: ${item.numero_carteirinha}`}
                    </div>
                  )}
                </div>

                {item.status !== "Cancelado" && !item.atendimento_id && (
                  <IconButton
                    onClick={() => handleCancelClick(item.id)}
                    size="small"
                    sx={{
                      color: "#d32f2f",
                      "&:hover": { backgroundColor: "#ffebee" },
                    }}
                    title="Cancelar agendamento"
                  >
                    <Cancel />
                  </IconButton>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Modos "Semana", "Mês" e "Personalizado" - com separadores por dia
          <div className="appointments-list">
            {groupByDay(agendaDoDia).map((grupo, index) => (
              <React.Fragment key={grupo.dia}>
                {/* Separador de Dia */}
                <Box sx={{ mb: 2, mt: index > 0 ? 3 : 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: "#2c3e50",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: "1rem" }} />
                    {dayjs(grupo.dia).format("dddd, DD [de] MMMM [de] YYYY")}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Box>

                {/* Agendamentos do dia */}
                {grupo.agendamentos.map((item) => (
                  <div key={item.id} className="appointment-item">
                    <div className="appointment-time">
                      {dayjs(item.data_hora).format("HH:mm")}
                    </div>

                    <div className="appointment-avatar">
                      {item.paciente_nome?.charAt(0).toUpperCase() || "?"}
                    </div>

                    <div className="appointment-info">
                      <div className="appointment-patient-name">
                        {item.paciente_nome}
                      </div>
                      <div className="appointment-type">
                        {item.tipo_consulta || "Consulta Padrão"}
                      </div>
                      {item.convenio && (
                        <div style={{ fontSize: "0.75rem", color: "#888", marginTop: "4px" }}>
                          {item.convenio}
                          {item.numero_carteirinha && ` - Carteirinha: ${item.numero_carteirinha}`}
                        </div>
                      )}
                    </div>

                    {item.status !== "Cancelado" && !item.atendimento_id && (
                      <IconButton
                        onClick={() => handleCancelClick(item.id)}
                        size="small"
                        sx={{
                          color: "#d32f2f",
                          "&:hover": { backgroundColor: "#ffebee" },
                        }}
                        title="Cancelar agendamento"
                      >
                        <Cancel />
                      </IconButton>
                    )}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </Paper>

      {/* Diálogo de Confirmação */}
      <Dialog open={confirmDialog.open} onClose={handleCloseDialog}>
        <DialogTitle>Confirmar Cancelamento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Não
          </Button>
          <Button onClick={handleConfirmCancel} color="error" variant="contained">
            Sim, Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default HomePage;
