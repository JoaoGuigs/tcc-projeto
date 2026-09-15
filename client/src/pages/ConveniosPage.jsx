import { useState } from "react";
import { Alert, Box, Button, CircularProgress, List, ListItem, ListItemText, TextField, Typography } from "@mui/material";
import { useConvenios, useCreateConvenio } from "../hooks/useConvenios";

export default function ConveniosPage() {
  const [nomeConvenio, setNomeConvenio] = useState("");
  const { data: convenios = [], isPending, error } = useConvenios();
  const createConvenio = useCreateConvenio();

  async function handleSubmit(event) {
    event.preventDefault();
    const name = nomeConvenio.trim();
    if (!name) return;
    await createConvenio.mutateAsync(name);
    setNomeConvenio("");
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>Gerenciar Convênios</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        <TextField label="Nome do Novo Convênio" fullWidth value={nomeConvenio} onChange={(event) => setNomeConvenio(event.target.value)} sx={{ mb: 2 }} />
        <Button type="submit" variant="contained" disabled={createConvenio.isPending || !nomeConvenio.trim()}>
          {createConvenio.isPending ? "Salvando..." : "Salvar Novo Convênio"}
        </Button>
      </Box>
      {(error || createConvenio.error) && <Alert severity="error">{error?.userMessage || createConvenio.error?.userMessage || "Erro ao acessar convênios."}</Alert>}
      <Typography variant="h5">Convênios Cadastrados</Typography>
      {isPending ? <CircularProgress size={24} /> : (
        <List sx={{ bgcolor: "background.paper" }}>
          {convenios.map((convenio) => <ListItem key={convenio.id}><ListItemText primary={convenio.nome_convenio} /></ListItem>)}
        </List>
      )}
    </Box>
  );
}
