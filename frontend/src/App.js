import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Fade } from "@mui/material";
import { Cloud as CloudIcon } from "@mui/icons-material";

// Layout Components
import Layout from "./components/Layout/Layout";
import AuthLayout from "./components/Layout/AuthLayout";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Files from "./pages/Files";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import Profile from "./pages/Profile";
import Trash from "./pages/Trash";
import Shared from "./pages/Shared";
import Admin from "./pages/Admin";

// Protected Route Component
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Hooks
import { useAuth } from "./contexts/AuthContext";

// Enhanced Loading Component
const LoadingScreen = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
          opacity: 0.3,
        },
      }}
    >
      {/* Floating particles animation */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        {[...Array(6)].map((_, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.3)",
              animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
              animationDelay: `${index * 0.5}s`,
              left: `${20 + index * 15}%`,
              top: `${20 + index * 10}%`,
              "@keyframes float": {
                "0%, 100%": {
                  transform: "translateY(0px) rotate(0deg)",
                  opacity: 0.3,
                },
                "50%": {
                  transform: "translateY(-20px) rotate(180deg)",
                  opacity: 0.8,
                },
              },
            }}
          />
        ))}
      </Box>

      <Fade in={true} timeout={1000}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 1,
            position: "relative",
          }}
        >
          {/* Logo and Brand */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 4,
              animation: "pulse 2s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": {
                  transform: "scale(1)",
                },
                "50%": {
                  transform: "scale(1.05)",
                },
              },
            }}
          >
            <CloudIcon
              sx={{
                fontSize: 64,
                color: "white",
                mr: 2,
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
              }}
            />
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                letterSpacing: 1,
              }}
            >
              Storify
            </Typography>
          </Box>

          {/* Loading Spinner */}
          <Box sx={{ position: "relative", mb: 3 }}>
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: "white",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          </Box>

          {/* Loading Text */}
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontWeight: 500,
              textAlign: "center",
              mb: 2,
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            Loading your cloud storage...
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255,255,255,0.8)",
              textAlign: "center",
              maxWidth: 300,
              lineHeight: 1.6,
            }}
          >
            Securing your connection and preparing your workspace
          </Typography>

          {/* Progress Dots */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 3,
            }}
          >
            {[...Array(3)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  animation: `bounce 1.4s ease-in-out infinite both`,
                  animationDelay: `${index * 0.16}s`,
                  "@keyframes bounce": {
                    "0%, 80%, 100%": {
                      transform: "scale(0)",
                    },
                    "40%": {
                      transform: "scale(1)",
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Fade>
    </Box>
  );
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Root route */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />

      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route
          path="login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password/:token" element={<ResetPassword />} />
        <Route path="verify-email/:token" element={<VerifyEmail />} />
      </Route>

      {/* Protected Routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="files" element={<Files />} />
        <Route path="profile" element={<Profile />} />
        <Route path="trash" element={<Trash />} />
        <Route path="shared" element={<Shared />} />

        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Route>

      {/* Catch all route */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/auth/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;
