import React from "react";
import { Typography, Box, Avatar, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
 export function Header({title}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
      }}
    >
      <Typography variant="h4">{title || ""}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32 }}>{user?.nome?.charAt(0)?.toUpperCase() || "U"}</Avatar>
        <Typography>{user?.nome || "Usuário"}</Typography>
        <Button size="small" onClick={handleLogout}>Sair</Button>
      </Box>
    </Box>
  );
}
