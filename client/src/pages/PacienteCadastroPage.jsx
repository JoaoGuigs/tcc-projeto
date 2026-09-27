import { useState, useEffect } from "react";
import api from "../services/api";
import { formatPhone } from "../utils/phone";
import { toPatientPayload, validatePatient } from "../lib/patientSchema";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";

function PacienteCadastroPage() {
  const { setPageTitle } = useOutletContext();

  const [formData, setFormData] = useState({
    nome_completo: "",
    celular: "",
    convenio_id: "",
    profissao: "",
    numero_carteirinha: "",
    descricao_problema: "",
  });
  const [errors, setErrors] = useState({
    nome_completo: "",
    celular: "",
  });
  const [convenios, setConvenios] = useState([]);
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

  useEffect(() => {
    setPageTitle("Cadastro de Paciente");
  }, [setPageTitle]);

  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        const response = await api.get("/convenios");
        setConvenios(response.data);
      } catch {
        showSnackbar("Erro ao carregar convênios", "error");
      }
    };
    fetchConvenios();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    // Se for o campo numero_carteirinha, permite apenas números
    if (name === 'numero_carteirinha') {
      const onlyNumbers = value.replace(/\D/g, '');
      setFormData((prevState) => ({
        ...prevState,
        [name]: onlyNumbers,
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  // Formata o telefone usando util compartilhado (suporta DDI 55 opcional).
  const handlePhoneChange = (event) => {
    setFormData((prevState) => ({
      ...prevState,
      celular: formatPhone(event.target.value || ""),
    }));
  };
  // Função para enviar o formulário
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({
      nome_completo: "",
      celular: "",
    });

    const validation = validatePatient(formData);
    if (!validation.ok) {
      setErrors({
        nome_completo: validation.errors.nome_completo || "",
        celular: validation.errors.celular || "",
      });
      return;
    }

    try {
      // Payload normalizado via schema compartilhado (preserva DDI se informado)
      const payload = toPatientPayload(formData);
      await api.post("/pacientes", payload);
      showSnackbar("Paciente cadastrado com sucesso!", "success");
      // Limpa o formulário
      setFormData({
        nome_completo: "",
        celular: "",
        convenio_id: "",
        profissao: "",
        numero_carteirinha: "",
        descricao_problema: "",
      });

      // Opcional: redireciona para a lista de pacientes (que ainda não temos)
      // setTimeout(() => navigate('/pacientes'), 2000);
    } catch (err) {
      showSnackbar(err.userMessage || "Erro ao cadastrar paciente.", "error");
    }
  };

  return (
    <Box sx={{ padding: "32px 48px", width: "100%", display: "flex", justifyContent: "center" }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f0f0f0",
          width: "100%",
          maxWidth: "800px",
        }}
      >
        <TextField
          name="nome_completo"
          label="Nome Completo"
          value={formData.nome_completo}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
          error={!!errors.nome_completo}
          helperText={errors.nome_completo}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <TextField
            name="celular"
            label="Celular"
            value={formData.celular}
            onChange={handlePhoneChange}
            fullWidth
            required
            error={!!errors.celular}
            helperText={errors.celular}
          />
          <TextField
            name="profissao"
            label="Profissão"
            value={formData.profissao}
            onChange={handleChange}
            fullWidth
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="convenio-label">Convênio Médico</InputLabel>
            <Select
              labelId="convenio-label"
              name="convenio_id"
              value={formData.convenio_id}
              label="Convênio Médico"
              onChange={handleChange}
              sx={{
                borderRadius: "12px",
                backgroundColor: "#fff",
                transition: "border-color .15s, box-shadow .15s, transform .15s",
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2f6f68" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2f6f68", borderWidth: 2, boxShadow: "0 0 0 3px rgba(47,111,104,.12)" },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: "12px",
                    border: "1px solid #e6e2da",
                    boxShadow: "0 12px 32px rgba(31,42,36,.12)",
                    "& .MuiMenuItem-root": {
                      fontSize: 14,
                      transition: "background-color .12s",
                      "&:hover": { backgroundColor: "#d9e8e4" },
                      "&.Mui-selected": { backgroundColor: "#d9e8e4", fontWeight: 700, "&:hover": { backgroundColor: "#cce0db" } },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Selecione um convênio</em>
              </MenuItem>
              {convenios.map((convenio) => (
                <MenuItem key={convenio.id} value={convenio.id}>
                  {convenio.nome_convenio}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="numero_carteirinha"
            label="Número da Carteirinha"
            value={formData.numero_carteirinha}
            onChange={handleChange}
            fullWidth
          />
        </Box>

        <TextField
          name="descricao_problema"
          label="Descrição do Problema"
          value={formData.descricao_problema}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            onClick={() => {
              setFormData({
                nome_completo: "",
                celular: "",
                convenio_id: "",
                profissao: "",
                numero_carteirinha: "",
                descricao_problema: "",
              });
              setErrors({ nome_completo: "", celular: "" });
            }}
            sx={{
              color: "#1f2a24",
              borderColor: "#e6e2da",
              borderRadius: "12px",
              transition: "all .15s",
              "&:hover": {
                borderColor: "rgba(47,111,104,.4)",
                backgroundColor: "#f7f5f1",
                transform: "translateY(-1px)",
              },
              "&:active": { transform: "translateY(0) scale(.98)" },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "#2f6f68",
              color: "white",
              borderRadius: "12px",
              transition: "all .15s",
              "&:hover": {
                backgroundColor: "#245a54",
                transform: "translateY(-1px)",
                boxShadow: "0 6px 16px rgba(47,111,104,.25)",
              },
              "&:active": { transform: "translateY(0) scale(.98)" },
            }}
          >
            Salvar Paciente
          </Button>
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
    </Box>
  );
}

export default PacienteCadastroPage;
