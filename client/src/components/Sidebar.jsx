import React from 'react';

import { Drawer, Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 240;

 export function Sidebar() {
    return (
        <Drawer
            variant="permanent"
            anchor='left'
            sx={{
                width: drawerWidth,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: '#202938',
                    color: 'white',

                },
            }}
        >
            <Box sx={{ p: 2 }}>
                <Typography variant='h5' component="h1">
                    Clinica da Cris
                </Typography>
            </Box>
            <List>
                <ListItemButton selected={true}>
                    <ListItemIcon sx={{ color: 'white' }}>
                        <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Inicio" />
                </ListItemButton>

                <ListItemButton >
                    <ListItemIcon sx={{ color: 'white' }}>
                        <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText primary="Pacientes" />
                </ListItemButton>

                <ListItemButton >
                    <ListItemIcon sx={{ color: 'white' }}>
                        <CalendarTodayIcon />
                    </ListItemIcon>
                    <ListItemText primary="Agenda" />
                </ListItemButton>

                <ListItemButton >
                    <ListItemIcon sx={{ color: 'white' }}>
                        <AssessmentIcon />
                    </ListItemIcon>
                    <ListItemText primary="Relatorios" />
                </ListItemButton>

                <ListItemButton >
                    <ListItemIcon sx={{ color: 'white' }}>
                        <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Configurações" />
                </ListItemButton>

            </List>
            </Drawer>
            )


}