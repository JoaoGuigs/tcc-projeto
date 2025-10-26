// client/src/pages/HomePage.jsx

import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
// NOTE: Removemos o 'Grid' dos imports do MUI
import {
  Search,
  PersonAdd,
  CalendarToday,
  Description,
} from "@mui/icons-material";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import "./css/HomePage.css"; // Continuamos usando seu CSS!

const API_URL = "http://localhost:3001";

function HomePage() {
  const { setPageTitle } = useOutletContext();
  const [agendaDoDia, setAgendaDoDia] = useState([]);

  // (A lógica do useEffect e do fetchAgendamentos continua 100% igual...)
  useEffect(() => {
    setPageTitle("Início"); // Mudei de "" para "Início" para o Header funcionar
  }, [setPageTitle]);

  useEffect(() => {
    const fetchAgendamentos = async () => {
      try {
        const response = await axios.get(`${API_URL}/agendamentos`);
        setAgendaDoDia(response.data);
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
      }
    };
    fetchAgendamentos();
  }, []);

  // 5. O JSX (visual) refatorado com Bootstrap
  return (
    <Box className="homepage-container">
      {/* Barra de busca (MUI) */}
      <TextField
        className="search-bar mb-4"
        placeholder="Buscar paciente..."
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search className="search-icon" />
            </InputAdornment>
          ),
        }}
      />

      {/* Seção de Cards de Ação com Bootstrap */}
      {/* MUDANÇA AQUI: Trocamos <Grid container> por <div className="row">
        'g-3' é o espaçamento e 'mb-4' é a margem inferior do Bootstrap 
      */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <RouterLink to="/pacientes/novo" className="action-link-wrapper">
            <Card className="action-card d-flex">
              <CardContent className=" action-card-content d-flex flex-row align-items-center gap-2">
                <PersonAdd className="action-card-icon mb-0" />
                <Typography
                  variant="h6"
                  component="h2"
                  className="action-card-title"
                >
                  Novo Paciente
                </Typography>
              </CardContent>
            </Card>
          </RouterLink>{" "}
          {/* 3. Fechamos o Link aqui */}
        </div>

        <div className="col-12 col-md-4">
          <RouterLink to="/agendar" className="action-link-wrapper">
            <Card className="action-card  d-flex">
              {" "}
              <CardContent className="action-card-content d-flex flex-row align-items-center gap-2">
                <CalendarToday className="action-card-icon mb-0" />{" "}
                <Typography
                  variant="h6"
                  component="h2"
                  className="action-card-title"
                >
                  Agendar Consulta
                </Typography>
              </CardContent>
            </Card>
          </RouterLink>
        </div>

        <div className="col-12 col-md-4">
          {/* 1. Envolve com RouterLink */}
          <RouterLink to="/atendimentos/novo" className="action-link-wrapper">
            <Card className="action-card d-flex">
              <CardContent className="action-card-content d-flex flex-row align-items-center gap-2">
                <Description className="action-card-icon mb-0" />
                <Typography
                  variant="h6"
                  component="h2"
                  className="action-card-title"
                >
                  Novo Prontuário
                </Typography>
              </CardContent>
            </Card>
          </RouterLink>
        </div>
      </div>

      {/* Seção da Agenda do Dia (MUI) 
        (Mantivemos o <Paper> e <List> do MUI porque eles funcionam bem) 
      */}
      <Paper className="agenda-section">
        <Typography variant="h5" component="h2" className="agenda-title">
          Agenda do Dia
        </Typography>

        <List>
          {agendaDoDia.length === 0 ? (
            <ListItem className="agenda-empty">
              <ListItemText primary="Nenhum agendamento encontrado." />
            </ListItem>
          ) : (
            agendaDoDia.map((item) => (
              <ListItem key={item.id} className="appointment-item" divider>
                <ListItemAvatar>
                  <Avatar
                    className={
                      item.paciente_nome?.includes("Maria") ||
                      item.paciente_nome?.includes("Ana")
                        ? "female-avatar"
                        : "male-avatar"
                    }
                  >
                    {item.paciente_nome?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={item.paciente_nome}
                  secondary={item.tipo_consulta || "Consulta"}
                  className="appointment-info"
                />

                <Typography variant="body2" className="appointment-time">
                  {new Date(item.data_hora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
}

export default HomePage;
