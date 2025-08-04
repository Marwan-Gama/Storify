import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  Cloud as CloudIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  Folder as FolderIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import FileManager from "../components/FileManager/FileManager";
import api from "../services/api";

const Dashboard = () => {
  const { user, isAuthenticated, isLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [searchSort, setSearchSort] = useState("name");

  // Real data state
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalFolders: 0,
    storageUsed: 0,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5 GB default
    recentUploads: 0,
  });

  // Debounced fetch function
  const debouncedFetchDashboardData = useCallback(
    debounce(async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user's files and folders - using correct API endpoints
        const [filesResponse, foldersResponse] = await Promise.all([
          api.get("/api/files"), // Correct endpoint
          api.get("/api/folders"), // Correct endpoint
        ]);

        // Set files data - handle the correct response structure
        const userFiles =
          filesResponse.data.data?.files || filesResponse.data.data || [];
        setFiles(userFiles);

        // Set folders data - handle the correct response structure
        const userFolders =
          foldersResponse.data.data?.folders || foldersResponse.data.data || [];
        setFolders(userFolders);

        // Set storage statistics - using user data from profile
        setStats({
          totalFiles: userFiles.length,
          totalFolders: userFolders.length,
          storageUsed: user?.storageUsed || 0,
          storageLimit: user?.storageLimit || 5 * 1024 * 1024 * 1024,
          recentUploads: 0, // This would need a separate API call
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);

        // Handle specific error types
        if (err.response?.status === 429) {
          setError("Too many requests. Please wait a moment and try again.");
        } else if (err.response?.status === 401) {
          setError("Authentication required. Please log in again.");
        } else if (err.response?.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Failed to load dashboard data. Please try again.");
        }

        // Set empty data on error
        setFiles([]);
        setFolders([]);
        setStats({
          totalFiles: 0,
          totalFolders: 0,
          storageUsed: user?.storageUsed || 0,
          storageLimit: user?.storageLimit || 5 * 1024 * 1024 * 1024,
          recentUploads: 0,
        });
      } finally {
        setLoading(false);
      }
    }, 2000), // Increased to 2 seconds debounce
    [user]
  );

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  useEffect(() => {
    // Disabled automatic fetching to prevent rate limiting
    // Only fetch when user clicks refresh button
    // if (isAuthenticated && !isLoading) {
    //   debouncedFetchDashboardData();
    // }
  }, [isAuthenticated, isLoading, debouncedFetchDashboardData]);

  const fetchDashboardData = () => {
    // Remove debounce for manual refresh
    setLoading(true);
    setError(null);

    Promise.all([api.get("/api/files"), api.get("/api/folders")])
      .then(([filesResponse, foldersResponse]) => {
        // Set files data - handle the correct response structure
        const userFiles =
          filesResponse.data.data?.files || filesResponse.data.data || [];
        setFiles(userFiles);

        // Set folders data - handle the correct response structure
        const userFolders =
          foldersResponse.data.data?.folders || foldersResponse.data.data || [];
        setFolders(userFolders);

        // Set storage statistics - using user data from profile
        setStats({
          totalFiles: userFiles.length,
          totalFolders: userFolders.length,
          storageUsed: user?.storageUsed || 0,
          storageLimit: user?.storageLimit || 5 * 1024 * 1024 * 1024,
          recentUploads: 0,
        });
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);

        // Handle specific error types
        if (err.response?.status === 429) {
          setError("Too many requests. Please wait a moment and try again.");
        } else if (err.response?.status === 401) {
          setError("Authentication required. Please log in again.");
        } else if (err.response?.status >= 500) {
          setError("Server error. Please try again later.");
        } else {
          setError("Failed to load dashboard data. Please try again.");
        }

        // Set empty data on error
        setFiles([]);
        setFolders([]);
        setStats({
          totalFiles: 0,
          totalFolders: 0,
          storageUsed: user?.storageUsed || 0,
          storageLimit: user?.storageLimit || 5 * 1024 * 1024 * 1024,
          recentUploads: 0,
        });
      })
      .finally(() => {
        setLoading(false);
      });
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

  // Get user display name with proper fallbacks
  const getUserDisplayName = () => {
    if (!isAuthenticated || !user) {
      return "Guest";
    }
    if (user.name) return user.name;
    if (user.username) return user.username;
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split("@")[0]; // Use email prefix as fallback
    return "User";
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

  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]); // Add fetchDashboardData as dependency

  const handleUpload = async () => {
    try {
      // Create a file input element
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;

      input.onchange = async (event) => {
        const files = Array.from(event.target.files);

        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);

          try {
            await api.post("/api/files/upload", formData, {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                console.log(
                  `Upload progress for ${file.name}: ${percentCompleted}%`
                );
              },
            });
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            setError(`Failed to upload ${file.name}. Please try again.`);
          }
        }

        // Refresh data after upload
        fetchDashboardData();
      };

      input.click();
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload files. Please try again.");
    }
  };

  const handleCreateFolder = async () => {
    try {
      const folderName = prompt("Enter folder name:");
      if (folderName && folderName.trim()) {
        await api.post("/api/folders", {
          name: folderName.trim(),
        });

        // Refresh data after creating folder
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Create folder error:", error);
      setError("Failed to create folder. Please try again.");
    }
  };

  const handleFileAction = async (action, item) => {
    try {
      switch (action) {
        case "view":
          // For files, this could open a preview
          if (item.type === "file") {
            window.open(`/api/files/${item.id}/preview`, "_blank");
          } else {
            // For folders, navigate to folder contents
            console.log("Navigate to folder:", item.name);
          }
          break;

        case "download":
          if (item.type === "file") {
            const response = await api.get(`/api/files/${item.id}/download`, {
              responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", item.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
          }
          break;

        case "share":
          // Open share dialog or navigate to share page
          console.log("Share functionality for:", item.name);
          break;

        case "rename":
          const newName = prompt(`Enter new name for ${item.name}:`);
          if (newName && newName.trim()) {
            if (item.type === "file") {
              await api.put(`/api/files/${item.id}`, { name: newName.trim() });
            } else {
              await api.put(`/api/folders/${item.id}`, {
                name: newName.trim(),
              });
            }
            // Refresh data
            fetchDashboardData();
          }
          break;

        case "copy":
          const copyName = prompt(`Enter name for copy of ${item.name}:`);
          if (copyName && copyName.trim()) {
            if (item.type === "file") {
              await api.post(`/api/files/${item.id}/copy`, {
                name: copyName.trim(),
              });
            } else {
              await api.post(`/api/folders/${item.id}/copy`, {
                name: copyName.trim(),
              });
            }
            // Refresh data
            fetchDashboardData();
          }
          break;

        case "move":
          // This would typically open a folder selection dialog
          console.log("Move functionality for:", item.name);
          // For now, we'll move to root (no folder)
          const confirmMove = window.confirm(
            `Are you sure you want to move "${item.name}" to root?`
          );
          if (confirmMove) {
            if (item.type === "file") {
              await api.put(`/api/files/${item.id}/move`, { folderId: null });
            } else {
              await api.put(`/api/folders/${item.id}/move`, { parentId: null });
            }
            // Refresh data
            fetchDashboardData();
          }
          break;

        case "delete":
          const confirmDelete = window.confirm(
            `Are you sure you want to delete "${item.name}"?`
          );
          if (confirmDelete) {
            if (item.type === "file") {
              await api.delete(`/api/files/${item.id}`);
            } else {
              await api.delete(`/api/folders/${item.id}`);
            }
            // Refresh data
            fetchDashboardData();
          }
          break;

        case "permissions":
          // Open permissions dialog
          console.log("Permissions functionality for:", item.name);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on ${item.name}:`, error);
      setError(`Failed to ${action} ${item.name}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
          background:
            "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(102, 126, 234, 0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
            opacity: 0.5,
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          {/* Loading Spinner */}
          <Box sx={{ position: "relative", mb: 3 }}>
            <CircularProgress
              size={48}
              thickness={4}
              sx={{
                color: "primary.main",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: "rgba(102, 126, 234, 0.2)",
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": {
                    transform: "translate(-50%, -50%) scale(1)",
                    opacity: 0.5,
                  },
                  "50%": {
                    transform: "translate(-50%, -50%) scale(1.2)",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* Loading Text */}
          <Typography
            variant="h6"
            sx={{
              color: "text.primary",
              fontWeight: 500,
              mb: 1,
            }}
          >
            Loading dashboard...
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              maxWidth: 300,
              lineHeight: 1.6,
            }}
          >
            Fetching your files and storage information
          </Typography>

          {/* Progress Dots */}
          <Box
            sx={{
              display: "flex",
              gap: 0.5,
              mt: 2,
              justifyContent: "center",
            }}
          >
            {[...Array(3)].map((_, index) => (
              <Box
                key={index}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "primary.main",
                  opacity: 0.4,
                  animation: `bounce 1.4s ease-in-out infinite both`,
                  animationDelay: `${index * 0.16}s`,
                  "@keyframes bounce": {
                    "0%, 80%, 100%": {
                      transform: "scale(0)",
                      opacity: 0.4,
                    },
                    "40%": {
                      transform: "scale(1)",
                      opacity: 1,
                    },
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {getGreeting()}, {getUserDisplayName()}!
            </Typography>
            {loading && (
              <CircularProgress size={20} sx={{ ml: 2 }} color="primary" />
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchDashboardData}
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={refreshProfile}
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              Refresh Profile
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Welcome back to your cloud storage dashboard
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={fetchDashboardData}
              disabled={loading}
            >
              Retry
            </Button>
          }
        >
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

      {/* File Manager */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          My Files
        </Typography>
        {files.length === 0 && folders.length === 0 && !loading && !error ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              px: 4,
              backgroundColor: "background.paper",
              borderRadius: 2,
              border: "2px dashed",
              borderColor: "divider",
            }}
          >
            <CloudIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Welcome to your Cloud Storage!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Click the refresh button above to load your files and folders.
            </Typography>
            <Button
              variant="contained"
              onClick={fetchDashboardData}
              startIcon={<RefreshIcon />}
            >
              Load My Files
            </Button>
          </Box>
        ) : (
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
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
