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
} from "@mui/material";
import {
  Search,
  PersonAdd,
  CalendarToday,
  Description,
  Today,
  DateRange,
  EventNote,
} from "@mui/icons-material";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import dayjs from "dayjs";
import "./css/HomePage.css";

const API_URL = "http://localhost:3001";

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

  // 3. Primeiro useEffect: Define o título da página no Header
  useEffect(() => {
    setPageTitle("Início");
  }, [setPageTitle]);

  // 4. Segundo useEffect: Busca os dados da API quando a página carrega ou quando o modo de visualização muda
  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        let params = {};
        
        if (viewMode === "hoje") {
          // Busca apenas os agendamentos de hoje
          const hoje = dayjs().format("YYYY-MM-DD");
          params.dataInicio = hoje;
          params.dataFim = hoje;
        } else if (viewMode === "semana") {
          // Busca os agendamentos da semana atual (domingo a sábado)
          const inicioSemana = dayjs().startOf("week").format("YYYY-MM-DD");
          const fimSemana = dayjs().endOf("week").format("YYYY-MM-DD");
          params.dataInicio = inicioSemana;
          params.dataFim = fimSemana;
        } else if (viewMode === "mes") {
          // Busca os agendamentos do mês atual
          const inicioMes = dayjs().startOf("month").format("YYYY-MM-DD");
          const fimMes = dayjs().endOf("month").format("YYYY-MM-DD");
          params.dataInicio = inicioMes;
          params.dataFim = fimMes;
        } else if (viewMode === "personalizado" && dataInicio && dataFim) {
          // Busca os agendamentos do período personalizado
          params.dataInicio = dataInicio;
          params.dataFim = dataFim;
        }

        // Chama a rota do backend que criamos
        const response = await axios.get(`${API_URL}/agendamentos`, { params });
        setAgendaDoDia(response.data); // Guarda os dados no estado
        setAgendaDoDiaOriginal(response.data); // Guarda a lista original
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
      }
    };

    fetchAgendamentos();
  }, [viewMode, dataInicio, dataFim]); // Recarrega quando mudar o modo ou as datas

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
      // O useEffect vai detectar a mudança e buscar os dados
      setViewMode("personalizado");
    }
  };

  // 8. Função para obter o título da agenda baseado no modo
  const getAgendaTitle = () => {
    if (viewMode === "hoje") return "Agenda do Dia";
    if (viewMode === "semana") return "Agenda da Semana";
    if (viewMode === "mes") return "Agenda do Mês";
    if (viewMode === "personalizado") return "Agendamentos por Período";
    return "Agendamentos";
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
          to="/agenda/nova"
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
        ) : (
          <div className="appointments-list">
            {agendaDoDia.map((item) => (
              <div key={item.id} className="appointment-item">
                {/* Horário e Data (se não for modo "hoje") */}
                <div className="appointment-time">
                  {viewMode !== "hoje" && (
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      {dayjs(item.data_hora).format("DD/MM")}
                    </div>
                  )}
                  {dayjs(item.data_hora).format("HH:mm")}
                </div>

                {/* Avatar do paciente */}
                <div className="appointment-avatar">
                  {item.paciente_nome?.charAt(0).toUpperCase() || "?"}
                </div>

                {/* Informações do paciente */}
                <div className="appointment-info">
                  <div className="appointment-patient-name">
                    {item.paciente_nome}
                  </div>
                  <div className="appointment-type">
                    {item.tipo_consulta || "Consulta Padrão"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Paper>
    </div>
  );
}

export default HomePage;
