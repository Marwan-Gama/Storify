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
  Paper,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Security as SecurityIcon,
  Share as ShareIcon,
  Speed as SpeedIcon,
  Cloud as CloudIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

const Home = () => {
  const features = [
    {
      icon: <CloudUploadIcon sx={{ fontSize: 48 }} />,
      title: "Secure File Storage",
      description:
        "Store your files safely in the cloud with enterprise-grade encryption and security protocols.",
      color: "#667eea",
    },
    {
      icon: <ShareIcon sx={{ fontSize: 48 }} />,
      title: "Easy Sharing",
      description:
        "Share files and folders with anyone, anywhere, anytime with just a few clicks.",
      color: "#764ba2",
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: "Privacy First",
      description:
        "Your data is encrypted and protected with the highest security standards and compliance.",
      color: "#10b981",
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      title: "Fast & Reliable",
      description:
        "Lightning-fast uploads and downloads with 99.9% uptime guarantee and global CDN.",
      color: "#f59e0b",
    },
  ];

  const stats = [
    { number: "10M+", label: "Files Stored" },
    { number: "500K+", label: "Active Users" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      features: [
        "1 GB Storage",
        "Basic Sharing",
        "Email Support",
        "Mobile App Access",
      ],
      popular: false,
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      features: [
        "10 GB Storage",
        "Advanced Sharing",
        "Priority Support",
        "File Versioning",
        "Advanced Security",
        "API Access",
      ],
      popular: true,
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: { xs: 6, md: 12 },
          textAlign: "center",
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
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "rgba(255,255,255,0.2)",
                fontSize: "2rem",
              }}
            >
              <CloudIcon />
            </Avatar>
          </Box>

          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              mb: 2,
            }}
          >
            Storify Cloud Storage
          </Typography>

          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{
              mb: 4,
              opacity: 0.9,
              fontWeight: 400,
              maxWidth: 600,
              mx: "auto",
            }}
          >
            Secure, fast, and reliable file storage for everyone. Store, share,
            and access your files from anywhere.
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
              mb: 4,
            }}
          >
            <Button
              component={RouterLink}
              to="/auth/login"
              variant="contained"
              size="large"
              sx={{
                bgcolor: "white",
                color: "primary.main",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "grey.100",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Sign In
            </Button>
            <Button
              component={RouterLink}
              to="/auth/register"
              variant="outlined"
              size="large"
              sx={{
                borderColor: "white",
                color: "white",
                px: 4,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderWidth: 2,
                "&:hover": {
                  borderColor: "white",
                  bgcolor: "rgba(255,255,255,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Get Started Free
            </Button>
          </Box>

          {/* Stats */}
          <Grid container spacing={4} sx={{ mt: 6 }}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {stat.number}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Why Choose Storify?
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto" }}
          >
            Experience the next generation of cloud storage with cutting-edge
            features
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "center",
                  p: 3,
                  borderRadius: 3,
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.15)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      color: feature.color,
                      mb: 3,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Pricing Section */}
      <Box sx={{ bgcolor: "grey.50", py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Simple, Transparent Pricing
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: "auto" }}
            >
              Choose the plan that fits your needs. No hidden fees, no
              surprises.
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {plans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper
                  elevation={plan.popular ? 8 : 2}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    textAlign: "center",
                    position: "relative",
                    border: plan.popular ? 2 : 1,
                    borderColor: plan.popular ? "primary.main" : "divider",
                    transform: plan.popular ? "scale(1.05)" : "none",
                    transition: "all 0.3s ease-in-out",
                    "&:hover": {
                      transform: plan.popular ? "scale(1.08)" : "scale(1.02)",
                      boxShadow: plan.popular
                        ? "0 16px 48px rgba(102, 126, 234, 0.3)"
                        : "0 8px 24px rgba(0, 0, 0, 0.12)",
                    },
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      sx={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontWeight: 600,
                      }}
                    />
                  )}

                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {plan.name}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {plan.period}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ textAlign: "left" }}>
                    {plan.features.map((feature, featureIndex) => (
                      <Box
                        key={featureIndex}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <CheckCircleIcon
                          sx={{
                            color: "success.main",
                            mr: 2,
                            fontSize: 20,
                          }}
                        />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Button
                    component={RouterLink}
                    to="/auth/register"
                    variant={plan.popular ? "contained" : "outlined"}
                    fullWidth
                    size="large"
                    sx={{
                      mt: 3,
                      py: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {plan.popular ? "Start Free Trial" : "Get Started"}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "white",
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Ready to get started?
          </Typography>
          <Typography
            variant="h6"
            sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}
          >
            Join thousands of users who trust Storify with their files
          </Typography>
          <Button
            component={RouterLink}
            to="/auth/register"
            variant="contained"
            size="large"
            sx={{
              px: 6,
              py: 2,
              fontSize: "1.1rem",
              fontWeight: 600,
              background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Create Free Account
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
