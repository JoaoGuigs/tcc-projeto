import LoginPage from "./pages/LoginPage";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ConveniosPage from "./pages/ConveniosPage";
import { MainLayout } from "./components/MainLayout";
import CadastroUsuarioPage from "./pages/CadastroUsuarioPage";
import PacienteCadastroPage from "./pages/PacienteCadastroPage";
import AgendarConsultaPage from "./pages/AgendarConsultaPage";
import RelatorioPacientePage from "./pages/RelatorioPacientePage";
import RegistrarAtendimentoPage from "./pages/RegistrarAtendimentoPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
const theme = createTheme({
  typography: {
    fontFamily: [
      "Poppins",
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
  },
  shape: {
    borderRadius: 16,
  },
});
function App() {
  return (
    <ThemeProvider theme={theme}>
      <Routes>
        {/* Rotas públicas que não têm a sidebar */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroUsuarioPage />} />{" "}
        {/* 2. Adicione esta linha */}
        {/* Rotas privadas que usam o layout principal */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/convenios" element={<ConveniosPage />} />
          <Route path="/pacientes/novo" element={<PacienteCadastroPage />} />
          <Route path="/agendar" element={<AgendarConsultaPage />} />
          <Route path="/relatorios" element={<RelatorioPacientePage />} />
          <Route path="/atendimentos/novo" element={<RegistrarAtendimentoPage />}/>
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          {/* ...outras rotas privadas */}
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
