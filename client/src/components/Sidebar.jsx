// client/src/components/Sidebar.jsx

import styles from "./Sidebar.module.css"; // Importa seu CSS Module

import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";

// 1. Importe o Link e o hook useLocation
import { Link as RouterLink, useLocation } from "react-router-dom";

const drawerWidth = 240;

// Mudamos para export default aqui (boa prática)
export function Sidebar() {
  // 2. Pegue a localização atual (URL)
  const location = useLocation();
  const currentPath = location.pathname;

  // Helper para criar os itens da lista
  const renderListItem = (text, icon, path) => (
    // 3. Envolvemos o ListItemButton com o RouterLink
    <RouterLink to={path} className={styles.linkWrapper}>
      <ListItemButton
        // 4. A prop 'selected' agora é dinâmica
        selected={currentPath === path}
        className={styles.listItem} // Adicionamos uma classe para estilização extra, se necessário
      >
        <ListItemIcon className={styles.icon}>{icon}</ListItemIcon>
        <ListItemText primary={text} />
      </ListItemButton>
    </RouterLink>
  );

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: "#202938", // Fundo escuro
        },
      }}
    >
      <Box className={styles.titleContainer}>
        <Typography variant="h5" component="h1" sx={{ color: "white" }}>
          PhysioClinic {/* Ou Clinica da Cris */}
        </Typography>
      </Box>

      {/* 5. A lista agora usa a função renderListItem */}
      <List className={styles.list}>
        {renderListItem("Início", <HomeIcon />, "/home")}

        {/* Link para Pacientes - Leva para a página de CADASTRAR por enquanto */}
        {renderListItem("Pacientes", <PeopleIcon />, "/pacientes/novo")}

        {/* Link para Agenda - Leva para a página de AGENDAR */}
        {renderListItem("Agenda", <CalendarTodayIcon />, "/agendar")}

        {/* Links que ainda não têm página (não são clicáveis) */}
        {renderListItem("Relatórios", <AssessmentIcon />, "/relatorios")}
        <ListItemButton disabled className={styles.listItem}>
          <ListItemIcon className={styles.icon}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Configurações" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
