import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { Header } from "./Header.jsx";
import { Box } from "@mui/material";

export function MainLayout() {
  const [pageTitle, setPageTitle ] = useState("Inicio");

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, backgroundColor: "#f8f9fb" }}
      >
        <Header title={pageTitle} />

        <Outlet context={{ setPageTitle  }}></Outlet>
      </Box>
    </Box>
  );
}
