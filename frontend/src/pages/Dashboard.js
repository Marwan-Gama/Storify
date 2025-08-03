import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Cloud as CloudIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  Folder as FolderIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import FileManager from "../components/FileManager/FileManager";

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [searchSort, setSearchSort] = useState("name");

  // Sample data - replace with real API calls
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "report.pdf",
      type: "file",
      size: "2.5 MB",
      shared: true,
      isPublic: false,
    },
    {
      id: 2,
      name: "presentation.pptx",
      type: "file",
      size: "15.2 MB",
      shared: false,
      isPublic: false,
    },
    {
      id: 3,
      name: "image.jpg",
      type: "file",
      size: "3.1 MB",
      shared: false,
      isPublic: true,
    },
  ]);

  const [folders, setFolders] = useState([
    {
      id: 1,
      name: "Documents",
      type: "folder",
      size: "12 items",
      shared: false,
      isPublic: false,
    },
    {
      id: 2,
      name: "Pictures",
      type: "folder",
      size: "45 items",
      shared: true,
      isPublic: false,
    },
    {
      id: 3,
      name: "Videos",
      type: "folder",
      size: "8 items",
      shared: false,
      isPublic: false,
    },
  ]);

  const [stats, setStats] = useState({
    totalFiles: 156,
    totalFolders: 23,
    storageUsed: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
    storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB
    recentUploads: 12,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

      // Mock data - replace with real API responses
      setStats({
        totalFiles: 156,
        totalFolders: 23,
        storageUsed: 2.5 * 1024 * 1024 * 1024,
        storageLimit: 5 * 1024 * 1024 * 1024,
        recentUploads: 12,
      });
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStorageUsagePercentage = () => {
    return Math.round((stats.storageUsed / stats.storageLimit) * 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Implement search logic here
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleFilterChange = (filter) => {
    setSearchFilter(filter);
    // Implement filter logic here
  };

  const handleSortChange = (sort) => {
    setSearchSort(sort);
    // Implement sort logic here
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleUpload = () => {
    // Implement upload logic
    console.log("Upload files");
  };

  const handleCreateFolder = () => {
    // Implement create folder logic
    console.log("Create folder");
  };

  const handleFileAction = (action, item) => {
    switch (action) {
      case "view":
        console.log("View:", item);
        break;
      case "download":
        console.log("Download:", item);
        break;
      case "share":
        console.log("Share:", item);
        break;
      case "rename":
        console.log("Rename:", item);
        break;
      case "copy":
        console.log("Copy:", item);
        break;
      case "move":
        console.log("Move:", item);
        break;
      case "delete":
        console.log("Delete:", item);
        break;
      case "permissions":
        console.log("Permissions:", item);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          {getGreeting()}, {user?.name || "User"}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back to your cloud storage dashboard
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CloudIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Total Files
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {stats.totalFiles}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Files in your storage
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <FolderIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Folders
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {stats.totalFolders}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Organized folders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Storage Used
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {formatFileSize(stats.storageUsed)}
              </Typography>
              <Box sx={{ mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={getStorageUsagePercentage()}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {getStorageUsagePercentage()}% of{" "}
                {formatFileSize(stats.storageLimit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Recent Uploads
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {stats.recentUploads}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label="Upload Files"
            color="primary"
            variant="outlined"
            onClick={handleUpload}
            sx={{ cursor: "pointer" }}
          />
          <Chip
            label="Create Folder"
            color="primary"
            variant="outlined"
            onClick={handleCreateFolder}
            sx={{ cursor: "pointer" }}
          />
          <Chip
            label="Shared Files"
            color="secondary"
            variant="outlined"
            onClick={() => console.log("View shared files")}
            sx={{ cursor: "pointer" }}
          />
        </Box>
      </Box>

      {/* File Manager */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          My Files
        </Typography>
        <FileManager
          files={files}
          folders={folders}
          loading={loading}
          error={error}
          onSearch={handleSearch}
          onViewModeChange={handleViewModeChange}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onRefresh={handleRefresh}
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
          onView={(item) => handleFileAction("view", item)}
          onDownload={(item) => handleFileAction("download", item)}
          onShare={(item) => handleFileAction("share", item)}
          onRename={(item) => handleFileAction("rename", item)}
          onCopy={(item) => handleFileAction("copy", item)}
          onMove={(item) => handleFileAction("move", item)}
          onDelete={(item) => handleFileAction("delete", item)}
          onPermissions={(item) => handleFileAction("permissions", item)}
          viewMode={viewMode}
          searchQuery={searchQuery}
          searchFilter={searchFilter}
          searchSort={searchSort}
          emptyMessage="No files or folders found. Start by uploading some files!"
        />
      </Box>
    </Box>
  );
};

export default Dashboard;
