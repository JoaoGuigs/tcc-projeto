import  { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";

const API_URL = "http://localhost:3001";

function PacienteCadastroPage() {
  const { setPageTitle } = useOutletContext();

  const [formData, setFormData] = useState({
    nome_completo: "",
    celular: "",
    convenio_id: "",
    numero_carteirinha: "",
    descricao_problema: "",
  });
  const [convenios, setConvenios] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    setPageTitle("Cadastro de Paciente");
  }, [setPageTitle]);

  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        const response = await axios.get(`${API_URL}/convenios`);
        setConvenios(response.data);
      } catch (err) {
        setError("erro ao carregar convenios");
      }
    };
    fetchConvenios();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  // Função para enviar o formulário
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.nome_completo) {
      setError("O nome completo é obrigatório.");
      return;
    }

    try {
      // Envia os dados para a rota do backend que já fizemos
      await axios.post(`${API_URL}/pacientes`, formData);
      setSuccess("Paciente cadastrado com sucesso!");
      // Limpa o formulário
      setFormData({
        nome_completo: "",
        celular: "",
        convenio_id: "",
        numero_carteirinha: "",
        descricao_problema: "",
      });

      // Opcional: redireciona para a lista de pacientes (que ainda não temos)
      // setTimeout(() => navigate('/pacientes'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao cadastrar paciente.");
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Dados do Paciente
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          name="nome_completo"
          label="Nome Completo"
          value={formData.nome_completo}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          name="celular"
          label="Celular"
          value={formData.celular}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        {/* Dropdown para os Convênios */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="convenio-label">Convênio</InputLabel>
          <Select
            labelId="convenio-label"
            name="convenio_id"
            value={formData.convenio_id}
            label="Convênio"
            onChange={handleChange}
          >
            <MenuItem value="">
              <em>Nenhum (Particular)</em>
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
          margin="normal"
        />
        <TextField
          name="descricao_problema"
          label="Descrição do Problema / Queixa Principal"
          value={formData.descricao_problema}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />

        <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
          Salvar Paciente
        </Button>
      </Box>
    </Container>
  );
}

export default PacienteCadastroPage;
