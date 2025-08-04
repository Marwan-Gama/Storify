import React, { useState, useEffect } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import FileManager from "../components/FileManager/FileManager";
import api from "../services/api";

const Files = () => {
  const { user: currentUser } = useAuth(); // Rename to currentUser to avoid unused variable warning
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [searchSort, setSearchSort] = useState("name");

  // Real data state
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
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
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");

      // Set empty data on error
      setFiles([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // TODO: Implement search API call
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleFilterChange = (filter) => {
    setSearchFilter(filter);
    // TODO: Implement filter API call
  };

  const handleSortChange = (sort) => {
    setSearchSort(sort);
    // TODO: Implement sort API call
  };

  const handleRefresh = () => {
    fetchFiles();
  };

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
        fetchFiles();
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
        fetchFiles();
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
            fetchFiles();
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
            fetchFiles();
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
            fetchFiles();
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
            fetchFiles();
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
