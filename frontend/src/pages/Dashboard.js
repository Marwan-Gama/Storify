import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  CreateNewFolder as FolderIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
} from "@mui/icons-material";
import { useFiles } from "../contexts/FileContext";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const {
    files,
    folders,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
  } = useFiles();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt("Enter folder name:");
    if (folderName) {
      // TODO: Implement folder creation
      console.log("Creating folder:", folderName);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType) => {
    // Simple file type detection
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("video")) return "🎥";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("document")) return "📝";
    return "📁";
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name || "User"}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your files and folders
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Uploading file... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* Actions Bar */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          component="label"
        >
          Upload File
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>

        <Button
          variant="outlined"
          startIcon={<FolderIcon />}
          onClick={handleCreateFolder}
        >
          New Folder
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          size="small"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <IconButton
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        >
          {viewMode === "grid" ? <ListIcon /> : <GridIcon />}
        </IconButton>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <LinearProgress sx={{ width: "100%" }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {/* Folders */}
          {folders.map((folder) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={folder.id}>
              <Card sx={{ cursor: "pointer", "&:hover": { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      📁
                    </Typography>
                    <Typography variant="subtitle1" noWrap>
                      {folder.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {folder.itemCount || 0} items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Files */}
          {files.map((file) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.id}>
              <Card sx={{ cursor: "pointer", "&:hover": { boxShadow: 4 } }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      {getFileIcon(file.mimeType)}
                    </Typography>
                    <Typography variant="subtitle1" noWrap>
                      {file.name}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    {formatFileSize(file.size)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {file.isShared && (
                      <Chip label="Shared" size="small" color="primary" />
                    )}
                    {file.isPublic && (
                      <Chip label="Public" size="small" color="secondary" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Empty State */}
          {files.length === 0 && folders.length === 0 && (
            <Grid item xs={12}>
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  border: "2px dashed",
                  borderColor: "grey.300",
                  borderRadius: 2,
                }}
              >
                <UploadIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No files yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Upload your first file or create a folder to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  component="label"
                >
                  Upload File
                  <input type="file" hidden onChange={handleFileUpload} />
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
