import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Security as SecurityIcon,
  Share as ShareIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

const Home = () => {
  const features = [
    {
      icon: <CloudUploadIcon sx={{ fontSize: 40 }} />,
      title: "Secure File Storage",
      description:
        "Store your files safely in the cloud with enterprise-grade security.",
    },
    {
      icon: <ShareIcon sx={{ fontSize: 40 }} />,
      title: "Easy Sharing",
      description: "Share files and folders with anyone, anywhere, anytime.",
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Privacy First",
      description:
        "Your data is encrypted and protected with the highest security standards.",
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: "Fast & Reliable",
      description:
        "Lightning-fast uploads and downloads with 99.9% uptime guarantee.",
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          py: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Cloud Storage Solution
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
            Secure, fast, and reliable file storage for everyone
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              component={RouterLink}
              to="/auth/login"
              variant="contained"
              size="large"
              sx={{ bgcolor: "white", color: "primary.main" }}
            >
              Sign In
            </Button>
            <Button
              component={RouterLink}
              to="/auth/register"
              variant="outlined"
              size="large"
              sx={{ borderColor: "white", color: "white" }}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" textAlign="center" gutterBottom>
          Why Choose Us?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  p: 2,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ color: "primary.main", mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: "grey.100", py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to get started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of users who trust us with their files
          </Typography>
          <Button
            component={RouterLink}
            to="/auth/register"
            variant="contained"
            size="large"
          >
            Create Free Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
