// client/src/pages/HomePage.jsx

import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import {
  Search,
  PersonAdd,
  CalendarToday,
  Description,
} from "@mui/icons-material";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import "./css/HomePage.css";

const API_URL = "http://localhost:3001";

function HomePage() {
  // 1. Pega a função 'setPageTitle' do MainLayout para definir o título
  const { setPageTitle } = useOutletContext();

  // 2. Cria um "estado" para guardar a lista de agendamentos que vem da API
  const [agendaDoDia, setAgendaDoDia] = useState([]);
  const [agendaDoDiaOriginal, setAgendaDoDiaOriginal] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 3. Primeiro useEffect: Define o título da página no Header
  useEffect(() => {
    setPageTitle("Início");
  }, [setPageTitle]);

  // 4. Segundo useEffect: Busca os dados da API quando a página carrega
  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        // Chama a rota do backend que criamos
        const response = await axios.get(`${API_URL}/agendamentos`);
        setAgendaDoDia(response.data); // Guarda os dados no estado
        setAgendaDoDiaOriginal(response.data); // Guarda a lista original
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
      }
    };

    fetchAgendamentos();
  }, []); // O array vazio [] faz isso rodar apenas uma vez

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
        <h5 className="agenda-title">Agenda do Dia</h5>

        {/* Lista de agendamentos */}
        {agendaDoDia.length === 0 ? (
          <div className="agenda-empty">
            <p>
              {searchTerm
                ? `Nenhum paciente encontrado com "${searchTerm}"`
                : "Nenhum agendamento para hoje."}
            </p>
          </div>
        ) : (
          <div className="appointments-list">
            {agendaDoDia.map((item) => (
              <div key={item.id} className="appointment-item">
                {/* Horário */}
                <div className="appointment-time">
                  {new Date(item.data_hora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
