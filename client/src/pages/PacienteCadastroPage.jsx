import { useState, useEffect } from "react";
import axios from "axios";
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

const API_URL = "http://localhost:3001";

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
        const response = await axios.get(`${API_URL}/convenios`);
        setConvenios(response.data);
      } catch (err) {
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

  // Formata o telefone conforme o usuário digita: (DD) 9xxxx-xxxx ou (DD) xxxx-xxxx
  const handlePhoneChange = (event) => {
    const raw = event.target.value || "";
    // Remove tudo que não for dígito
    const digits = raw.replace(/\D/g, "");

    let formatted = digits;
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 6) {
      // (DD) xxxx
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      // (DD) xxxx-xxxx
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      // (DD) 9xxxx-xxxx (11 digits)
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }

    setFormData((prevState) => ({
      ...prevState,
      celular: formatted,
    }));
  };
  // Função para enviar o formulário
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({
      nome_completo: "",
      celular: "",
    });

    let hasErrors = false;
    const newErrors = {
      nome_completo: "",
      celular: "",
    };

    if (!formData.nome_completo) {
      newErrors.nome_completo = "O nome completo é obrigatório";
      hasErrors = true;
    } else if (formData.nome_completo.length < 3) {
      newErrors.nome_completo = "O nome deve ter pelo menos 3 caracteres";
      hasErrors = true;
    }

    if (!formData.celular || String(formData.celular).trim() === '') {
      newErrors.celular = "O número de celular é obrigatório";
      hasErrors = true;
    } else if (formData.celular.replace(/\D/g, '').length < 10) {
      newErrors.celular = "Digite um número de celular válido com DDD";
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      // Envia os dados para a rota do backend que já fizemos
      // Normaliza celular para dígitos apenas antes de enviar
      const payload = { ...formData, celular: String(formData.celular || '').replace(/\D/g, '') };
      await axios.post(`${API_URL}/pacientes`, payload);
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
      showSnackbar(err.response?.data?.message || "Erro ao cadastrar paciente.", "error");
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
            type="submit"
            variant="contained"
            sx={{
              backgroundColor: "#2c3e50",
              color: "white",
              "&:hover": {
                backgroundColor: "#1a252f",
              },
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
