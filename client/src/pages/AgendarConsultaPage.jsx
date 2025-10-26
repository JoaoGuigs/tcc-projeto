// client/src/pages/AgendarConsultaPage.jsx
import "./css/AgendarConsultaPage.css";
import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  Button,
  Grid,
  InputAdornment,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import dayjs from "dayjs"; // Import dayjs
import "dayjs/locale/pt-br"; // Import locale pt-br

// Configura dayjs para usar português brasileiro
dayjs.locale("pt-br");

const API_URL = "http://localhost:3001";

// --- Dados de Exemplo (MOCK) para os Horários ---
// No futuro, isso virá da API baseado na data selecionada
const mockAvailableTimes = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
];

function AgendarConsultaPage() {
  const { setPageTitle } = useOutletContext();

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Usa dayjs para a data
  const [availableTimes, setAvailableTimes] = useState(mockAvailableTimes); // Começa com mock
  const [selectedTime, setSelectedTime] = useState(null);

  // Efeito para o título
  useEffect(() => {
    setPageTitle("Agendar Consulta");
  }, [setPageTitle]);

  // Efeito para buscar pacientes (igual ao anterior)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 2) {
        try {
          const response = await axios.get(
            `${API_URL}/pacientes?nome=${searchTerm}`
          );
          setSearchResults(response.data);
        } catch (error) {
          console.error("Erro:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Efeito para buscar horários disponíveis (por enquanto, só re-seta o mock)
  useEffect(() => {
    // --- LÓGICA FUTURA AQUI ---
    // Aqui você chamaria a API para buscar os horários
    // da 'selectedDate'. Ex: fetchTimes(selectedDate);
    // Por enquanto, apenas resetamos para o mock e limpamos a seleção
    setAvailableTimes(mockAvailableTimes);
    setSelectedTime(null);
  }, [selectedDate]); // Roda sempre que a data mudar

  // Handlers
  const handleSelectPatient = (paciente) => {
    setSelectedPatient(paciente);
    setSearchTerm(paciente.nome_completo);
    setSearchResults([]);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate); // newDate já é um objeto dayjs
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleConfirm = async () => {
    if (!selectedPatient || !selectedDate || !selectedTime) {
      alert("Por favor, selecione paciente, data e horário.");
      return;
    }

    // Formata a data e hora para enviar ao backend (ex: '2025-10-25 09:30:00')
    // CÓDIGO CORRIGIDO (dentro de handleConfirm)
    const dataHoraISO = selectedDate
      .hour(parseInt(selectedTime.split(":")[0]))
      .minute(parseInt(selectedTime.split(":")[1]))
      .second(0)
      .format("YYYY-MM-DD HH:mm:ss");

    const agendamentoData = {
      paciente_id: selectedPatient.id,
      // Precisamos do profissional_id - por enquanto, vamos fixar um (ex: 1)
      profissional_id: 1,
      data_hora: dataHoraISO,
      tipo_consulta: "Consulta Padrão", // Você pode adicionar um campo para isso
      observacoes: "",
      status: "Agendado",
    };

    try {
      // Chamada POST para a rota que ainda vamos criar no backend
      await axios.post(`${API_URL}/agendamentos`, agendamentoData);
      alert("Agendamento confirmado com sucesso!");
      // Limpar os campos ou navegar para outra página
      setSelectedPatient(null);
      setSearchTerm("");
      setSelectedDate(dayjs());
      setSelectedTime(null);
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      alert("Erro ao confirmar agendamento.");
    }
  };

  return (
    // Envolvemos tudo com o LocalizationProvider para o calendário funcionar
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box className="agendar-consulta-container">
        {/* --- Seção de Busca --- */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Buscar Paciente
          </Typography>
          <TextField
            fullWidth
            placeholder="Digite o nome do paciente..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          {searchResults.length > 0 && (
            <List
              sx={{
                bgcolor: "background.paper",
                mt: 1,
                border: "1px solid #ddd",
                borderRadius: 1,
                maxHeight: 150,
                overflow: "auto",
              }}
            >
              {searchResults.map((paciente) => (
                <ListItem
                  button
                  key={paciente.id}
                  onClick={() => handleSelectPatient(paciente)}
                >
                  <ListItemText primary={paciente.nome_completo} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* --- Seção Calendário e Horários (Layout com Grid) --- */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Coluna do Calendário */}
          <Grid item xs={12} md={7}>
            {/* Usamos o StaticDatePicker para o calendário embutido */}
            <StaticDatePicker
              displayStaticWrapperAs="desktop" // ou "mobile"
              value={selectedDate}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} />} // Necessário, mas não visível no modo estático
              // Desabilitar dias passados (opcional)
              minDate={dayjs()}
            />
          </Grid>

          {/* Coluna dos Horários */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Horários Disponíveis
              </Typography>
              <Grid container spacing={1}>
                {availableTimes.map((time) => (
                  <Grid item xs={6} key={time}>
                    <Button
                      fullWidth
                      variant={selectedTime === time ? "contained" : "outlined"} // Destaca o botão selecionado
                      onClick={() => handleTimeSelect(time)}
                    >
                      {time}
                    </Button>
                  </Grid>
                ))}
                {availableTimes.length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="textSecondary" align="center">
                      Nenhum horário disponível.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* --- Seção de Resumo --- */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumo do Agendamento
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="textSecondary">
                Paciente
              </Typography>
              <Typography>
                {selectedPatient ? selectedPatient.nome_completo : "-"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="body2" color="textSecondary">
                Data
              </Typography>
              {/* Formata a data selecionada */}
              <Typography>
                {selectedDate ? selectedDate.format("DD/MM/YYYY") : "-"}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Typography variant="body2" color="textSecondary">
                Horário
              </Typography>
              <Typography>{selectedTime || "-"}</Typography>
            </Grid>
          </Grid>
          {/* Aqui entraria a lista de próximas consultas do paciente */}
        </Paper>

        {/* --- Botões de Ação --- */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button variant="outlined">Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!selectedPatient || !selectedTime} // Só habilita se tudo estiver selecionado
          >
            Confirmar Agendamento
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}

export default AgendarConsultaPage;
