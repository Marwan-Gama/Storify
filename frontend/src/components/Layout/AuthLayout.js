import React from "react";
import { Outlet } from "react-router-dom";
import { Box, Container, Paper, Typography } from "@mui/material";
import { Cloud as CloudIcon } from "@mui/icons-material";

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
          <CloudIcon sx={{ fontSize: 60, color: "white", mb: 2 }} />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
              mb: 1,
            }}
          >
            Cloud Storage
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              textAlign: "center",
            }}
          >
            Secure file storage and sharing
          </Typography>
        </Box>

        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
