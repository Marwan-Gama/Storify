import React, { useState, useEffect } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import FileManager from "../components/FileManager/FileManager";

const Files = () => {
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
    {
      id: 4,
      name: "document.docx",
      type: "file",
      size: "1.8 MB",
      shared: true,
      isPublic: false,
    },
    {
      id: 5,
      name: "spreadsheet.xlsx",
      type: "file",
      size: "4.2 MB",
      shared: false,
      isPublic: false,
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
    {
      id: 4,
      name: "Music",
      type: "folder",
      size: "23 items",
      shared: false,
      isPublic: false,
    },
    {
      id: 5,
      name: "Projects",
      type: "folder",
      size: "7 items",
      shared: true,
      isPublic: false,
    },
  ]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      // Replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay
    } catch (err) {
      setError("Failed to load files");
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
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
    fetchFiles();
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
          My Files
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and organize your cloud storage files
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* File Manager */}
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
  );
};

export default Files;
