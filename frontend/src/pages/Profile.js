import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Divider,
  Button,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStorageUsagePercentage = () => {
    const maxStorage =
      user?.tier === "premium" ? 10 * 1024 * 1024 * 1024 : 1024 * 1024 * 1024;
    return Math.round(((user?.storageUsed || 0) / maxStorage) * 100);
  };

  const handleEdit = () => {
    setEditData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setEditMode(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(editData);
      setEditMode(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({
      name: user?.name || "",
      email: user?.email || "",
    });
  };

  const getTierColor = (tier) => {
    return tier === "premium" ? "success" : "default";
  };

  const getRoleColor = (role) => {
    return role === "admin" ? "error" : "primary";
  };

  return (
    <Box sx={{ maxWidth: "100%", mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Profile Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account information and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: "center",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              borderRadius: 3,
            }}
          >
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: "auto",
                mb: 2,
                bgcolor: "rgba(255,255,255,0.2)",
                fontSize: "3rem",
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </Avatar>

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              {user?.name || "User"}
            </Typography>

            <Box
              sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 2 }}
            >
              <Chip
                label={user?.role || "user"}
                size="small"
                color={getRoleColor(user?.role)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 500,
                }}
              />
              <Chip
                label={`${user?.tier || "free"} tier`}
                size="small"
                color={getTierColor(user?.tier)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 500,
                }}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <EmailIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {user?.email || "No email"}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <CalendarIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Member since{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "Unknown"}
              </Typography>
            </Box>

            {user?.isEmailVerified && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mt: 1,
                }}
              >
                <VerifiedIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Email verified
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Account Information */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Account Information
              </Typography>
              <Button
                variant="outlined"
                startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                onClick={editMode ? handleCancel : handleEdit}
                size="small"
              >
                {editMode ? "Cancel" : "Edit"}
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={editMode ? editData.name : user?.name || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  value={editMode ? editData.email : user?.email || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              {editMode && (
                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={loading}
                      sx={{
                        background:
                          "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                        boxShadow: "0 3px 5px 2px rgba(102, 126, 234, .3)",
                      }}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Storage Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Storage Usage
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <StorageIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Storage Used
                      </Typography>
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {formatFileSize(user?.storageUsed || 0)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      of {user?.tier === "premium" ? "10 GB" : "1 GB"} total
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={getStorageUsagePercentage()}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "grey.200",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background:
                            "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                        },
                      }}
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {getStorageUsagePercentage()}% used
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: "background.default" }}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <CloudIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Account Status
                      </Typography>
                    </Box>

                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2">Account Type:</Typography>
                        <Chip
                          label={user?.tier || "free"}
                          size="small"
                          color={getTierColor(user?.tier)}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2">Role:</Typography>
                        <Chip
                          label={user?.role || "user"}
                          size="small"
                          color={getRoleColor(user?.role)}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2">Status:</Typography>
                        <Chip
                          label={user?.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={user?.isActive ? "success" : "error"}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2">Email Verified:</Typography>
                        <Chip
                          label={user?.isEmailVerified ? "Yes" : "No"}
                          size="small"
                          color={user?.isEmailVerified ? "success" : "warning"}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Account Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Account Actions
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  onClick={() => setDialogOpen(true)}
                  sx={{ borderWidth: 2 }}
                >
                  Change Password
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  disabled={user?.tier === "premium"}
                  sx={{ borderWidth: 2 }}
                >
                  {user?.tier === "premium"
                    ? "Premium Active"
                    : "Upgrade to Premium"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your current password and choose a new one.
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Current Password"
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            margin="normal"
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Change Password</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
