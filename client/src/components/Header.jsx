import React from "react";
import { Typography, Box, Avatar } from "@mui/material";
 export function Header({title}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
      }}
    >
      <Typography variant="h4">{title || "a"}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Avatar sx={{ width: 32, height: 32 }}>D</Avatar>
        <Typography>Dra. Cris</Typography>
      </Box>
    </Box>
  );
}
