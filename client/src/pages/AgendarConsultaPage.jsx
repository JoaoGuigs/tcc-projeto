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
  Button,
  Grid,
  InputAdornment,
  Snackbar,
  Alert,
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

function AgendarConsultaPage() {
  const { setPageTitle } = useOutletContext();

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs()); // Usa dayjs para a data
  const [availableTimes, setAvailableTimes] = useState([]); // Inicia vazio
  const [selectedTime, setSelectedTime] = useState(null);
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
    setPageTitle("Agendar Consulta");
  }, [setPageTitle]);

  // Efeito para buscar pacientes (igual ao anterior)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
  if (searchTerm && searchTerm.trim().length >= 4) {
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

  // Efeito para buscar horários disponíveis
  useEffect(() => {
    const fetchAvailableTimes = async () => {
      try {
        // Por enquanto, vamos usar um profissional_id fixo (1)
        // TODO: Implementar seleção de profissional
        const response = await axios.get(
          `${API_URL}/agendamentos/horarios-disponiveis`, {
            params: {
              data: selectedDate.format('YYYY-MM-DD'),
              profissional_id: 1
            }
          }
        );
        setAvailableTimes(response.data);
      } catch (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        setAvailableTimes([]);
      }
      setSelectedTime(null);
    };

    if (selectedDate) {
      fetchAvailableTimes();
    }
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
      showSnackbar("Por favor, selecione paciente, data e horário.", "warning");
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
      showSnackbar("Agendamento confirmado com sucesso!", "success");
      // Limpar os campos ou navegar para outra página
      setSelectedPatient(null);
      setSearchTerm("");
      setSelectedDate(dayjs());
      setSelectedTime(null);
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error);
      showSnackbar(error.response?.data?.message || "Erro ao confirmar agendamento.", "error");
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box sx={{ padding: "32px 48px", width: "100%" }}>
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "32px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f0f0f0",
          }}
        >
          {/* Seção de Busca */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{ mb: 1.5, fontWeight: 500, color: "#666" }}
            >
              Buscar Paciente
            </Typography>
            <TextField
              fullWidth
              placeholder="Digite o nome do paciente..."
              variant="outlined"
              size="medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#9e9e9e" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                },
              }}
            />
            {searchResults.length > 0 && (
              <List
                sx={{
                  bgcolor: "white",
                  mt: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  maxHeight: 200,
                  overflow: "auto",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {searchResults.map((paciente) => (
                  <ListItem
                    button
                    key={paciente.id}
                    onClick={() => handleSelectPatient(paciente)}
                    sx={{
                      "&:hover": { backgroundColor: "#f5f5f5" },
                      borderBottom: "1px solid #f0f0f0",
                      "&:last-child": { borderBottom: "none" },
                    }}
                  >
                    <ListItemText primary={paciente.nome_completo} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Grid: Calendário e Horários */}
          <Box sx={{ display: "flex", gap: 4, mb: 4, flexWrap: "wrap" }}>
            {/* Calendário */}
            <Box sx={{ flex: "1.2 1 450px", minWidth: "400px" }}>
              <Box
                sx={{
                  "& .MuiPickersLayout-root": {
                    minWidth: "100%",
                  },
                  "& .MuiPickersLayout-contentWrapper": {
                    width: "100%",
                  },
                  "& .MuiDateCalendar-root": {
                    width: "100%",
                    maxHeight: "none",
                  },
                  "& .MuiPickersCalendarHeader-root": {
                    paddingLeft: "16px",
                    paddingRight: "16px",
                    marginTop: "8px",
                  },
                  "& .MuiDayCalendar-header": {
                    justifyContent: "space-between",
                    paddingLeft: "12px",
                    paddingRight: "12px",
                  },
                  "& .MuiDayCalendar-weekContainer": {
                    justifyContent: "space-between",
                    margin: "4px 0",
                  },
                  "& .MuiPickersDay-root": {
                    fontSize: "14px",
                    width: "40px",
                    height: "40px",
                    margin: "2px",
                  },
                  "& .MuiPickersDay-root.Mui-selected": {
                    backgroundColor: "#2c3e50 !important",
                    color: "#fff",
                    fontWeight: 600,
                  },
                  "& .MuiPickersCalendarHeader-label": {
                    fontSize: "15px",
                    fontWeight: 500,
                  },
                  "& .MuiPickersArrowSwitcher-root": {
                    gap: "8px",
                  },
                  "& .MuiDayCalendar-weekDayLabel": {
                    fontSize: "13px",
                    fontWeight: 500,
                    width: "40px",
                    height: "40px",
                  },
                  // Esconde os botões OK e Cancel
                  "& .MuiDialogActions-root": {
                    display: "none",
                  },
                  "& .MuiPickersLayout-actionBar": {
                    display: "none",
                  },
                }}
              >
                <StaticDatePicker
                  displayStaticWrapperAs="desktop"
                  value={selectedDate}
                  onChange={handleDateChange}
                  minDate={dayjs()}
                  slotProps={{
                    actionBar: {
                      actions: [],
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Horários Disponíveis */}
            <Box sx={{ flex: "1 1 300px", minWidth: "280px" }}>
              <Box sx={{ pl: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2.5, fontWeight: 600, color: "#333", fontSize: "15px" }}
                >
                  Horários Disponíveis
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                  {availableTimes.map((time) => (
                    <Button
                      key={time}
                      fullWidth
                      variant={
                        selectedTime === time ? "contained" : "outlined"
                      }
                      onClick={() => handleTimeSelect(time)}
                      sx={{
                        borderRadius: "6px",
                        textTransform: "none",
                        fontSize: "13px",
                        padding: "8px 12px",
                        minHeight: "38px",
                        ...(selectedTime === time
                          ? {
                              backgroundColor: "#2c3e50",
                              color: "#fff",
                              "&:hover": {
                                backgroundColor: "#1a252f",
                              },
                            }
                          : {
                              borderColor: "#e0e0e0",
                              color: "#333",
                              "&:hover": {
                                borderColor: "#bdbdbd",
                                backgroundColor: "#f5f5f5",
                              },
                            }),
                      }}
                    >
                      {time}
                    </Button>
                  ))}
                </Box>
                {availableTimes.length === 0 && (
                  <Typography
                    color="textSecondary"
                    align="center"
                    sx={{ py: 3, fontSize: "14px" }}
                  >
                    Nenhum horário disponível para esta data.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Resumo do Agendamento */}
          <Box
            sx={{
              backgroundColor: "#f8f9fa",
              padding: "20px",
              borderRadius: "8px",
              mb: 3,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ mb: 2, fontWeight: 600, color: "#333" }}
            >
              Resumo do Agendamento
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", mb: 0.5, fontSize: "13px" }}
                >
                  Paciente
                </Typography>
                <Typography sx={{ fontWeight: 500, fontSize: "15px" }}>
                  {selectedPatient ? selectedPatient.nome_completo : "-"}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", mb: 0.5, fontSize: "13px" }}
                >
                  Data
                </Typography>
                <Typography sx={{ fontWeight: 500, fontSize: "15px" }}>
                  {selectedDate ? selectedDate.format("DD/MM/YYYY") : "-"}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography
                  variant="body2"
                  sx={{ color: "#666", mb: 0.5, fontSize: "13px" }}
                >
                  Horário
                </Typography>
                <Typography sx={{ fontWeight: 500, fontSize: "15px" }}>
                  {selectedTime || "-"}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Botões de Ação */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedPatient(null);
                setSearchTerm("");
                setSelectedDate(dayjs());
                setSelectedTime(null);
              }}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                color: "#666",
                borderColor: "#ddd",
                "&:hover": {
                  borderColor: "#999",
                  backgroundColor: "#f5f5f5",
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              disabled={!selectedPatient || !selectedTime}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                backgroundColor: "#2c3e50",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#1a252f",
                },
                "&:disabled": {
                  backgroundColor: "#e0e0e0",
                  color: "#9e9e9e",
                },
              }}
            >
              Confirmar Agendamento
            </Button>
          </Box>
        </Box>
      </Box>

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
    </LocalizationProvider>
  );
}

export default AgendarConsultaPage;
