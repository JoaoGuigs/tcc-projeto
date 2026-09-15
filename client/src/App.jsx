import { lazy, Suspense } from "react";
import { Box, CircularProgress } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { MainLayout } from "./components/MainLayout";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const ConveniosPage = lazy(() => import("./pages/ConveniosPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const CadastroUsuarioPage = lazy(() => import("./pages/CadastroUsuarioPage"));
const PacienteCadastroPage = lazy(() => import("./pages/PacienteCadastroPage"));
const PacientesPage = lazy(() => import("./pages/PacientesPage"));
const AgendarConsultaPage = lazy(() => import("./pages/AgendarConsultaPage"));
const RelatorioPacientePage = lazy(() => import("./pages/RelatorioPacientePage"));
const RegistrarAtendimentoPage = lazy(() => import("./pages/RegistrarAtendimentoPage"));
const ConfiguracoesPage = lazy(() => import("./pages/ConfiguracoesPage"));
const WhatsAppPage = lazy(() => import("./pages/WhatsAppPage"));
const FinanceiroPage = lazy(() => import("./pages/FinanceiroPage"));

const theme = createTheme({
  typography: { fontFamily: ['"Source Sans 3"', "system-ui", "sans-serif"].join(",") },
  shape: { borderRadius: 16 },
});

const Loading = () => <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroUsuarioPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/convenios" element={<ConveniosPage />} />
                <Route path="/pacientes/novo" element={<PacienteCadastroPage />} />
                <Route path="/pacientes" element={<PacientesPage />} />
                <Route path="/agendar" element={<AgendarConsultaPage />} />
                <Route path="/relatorios" element={<RelatorioPacientePage />} />
                <Route path="/atendimentos/novo" element={<RegistrarAtendimentoPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                <Route path="/whatsapp" element={<WhatsAppPage />} />
                <Route path="/financeiro" element={<FinanceiroPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
