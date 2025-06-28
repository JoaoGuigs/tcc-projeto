import React from "react";
import LoginPage from "./pages/LoginPage"; // Importa sua página de login
import { createTheme, ThemeProvider } from "@mui/material/styles";

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
  shape:{
    borderRadius: 16, // Define um raio de borda padrão para todos os componentes
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        {/* Por enquanto, vamos exibir a página de login aqui */}
        <LoginPage />
      </div>
    </ThemeProvider>
  );
}

export default App;
