import React, { useState, useCallback } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import FileToolbar from "./FileToolbar";
import FileList from "./FileList";

const FileManager = ({
  files = [],
  folders = [],
  loading = false,
  error = null,
  onSearch,
  onViewModeChange,
  onFilterChange,
  onSortChange,
  onRefresh,
  onUpload,
  onCreateFolder,
  onView,
  onDownload,
  onShare,
  onRename,
  onCopy,
  onMove,
  onDelete,
  onPermissions,
  viewMode = "list",
  searchQuery = "",
  searchFilter = "all",
  searchSort = "name",
  emptyMessage = "No files or folders found",
  showToolbar = true,
  showFilters = true,
  showViewToggle = true,
  showActions = true,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSelectItem = useCallback((item) => {
    setSelectedItems((prev) => {
      const itemId = item.id || item.name;
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const handleSearchChange = useCallback(
    (query) => {
      onSearch?.(query);
    },
    [onSearch]
  );

  const handleViewModeChange = useCallback(
    (mode) => {
      onViewModeChange?.(mode);
    },
    [onViewModeChange]
  );

  const handleFilterChange = useCallback(
    (filter) => {
      onFilterChange?.(filter);
    },
    [onFilterChange]
  );

  const handleSortChange = useCallback(
    (sort) => {
      onSortChange?.(sort);
    },
    [onSortChange]
  );

  const handleRefresh = useCallback(() => {
    onRefresh?.();
    setSnackbar({
      open: true,
      message: "Files refreshed successfully",
      severity: "success",
    });
  }, [onRefresh]);

  const handleUpload = useCallback(() => {
    onUpload?.();
  }, [onUpload]);

  const handleCreateFolder = useCallback(() => {
    onCreateFolder?.();
  }, [onCreateFolder]);

  const handleFileAction = useCallback(
    (action, item) => {
      switch (action) {
        case "view":
          onView?.(item);
          break;
        case "download":
          onDownload?.(item);
          setSnackbar({
            open: true,
            message: `Downloading ${item.name}...`,
            severity: "info",
          });
          break;
        case "share":
          onShare?.(item);
          setSnackbar({
            open: true,
            message: `Sharing ${item.name}...`,
            severity: "info",
          });
          break;
        case "rename":
          onRename?.(item);
          break;
        case "copy":
          onCopy?.(item);
          setSnackbar({
            open: true,
            message: `${item.name} copied successfully`,
            severity: "success",
          });
          break;
        case "move":
          onMove?.(item);
          break;
        case "delete":
          onDelete?.(item);
          setSnackbar({
            open: true,
            message: `${item.name} deleted successfully`,
            severity: "success",
          });
          break;
        case "permissions":
          onPermissions?.(item);
          break;
        default:
          break;
      }
    },
    [
      onView,
      onDownload,
      onShare,
      onRename,
      onCopy,
      onMove,
      onDelete,
      onPermissions,
    ]
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      {showToolbar && (
        <FileToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchFilter={searchFilter}
          onSearchFilterChange={handleFilterChange}
          searchSort={searchSort}
          onSearchSortChange={handleSortChange}
          selectedCount={selectedItems.length}
          onRefresh={handleRefresh}
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
          onClearSelection={handleClearSelection}
          showFilters={showFilters}
          showViewToggle={showViewToggle}
          showActions={showActions}
        />
      )}

      <FileList
        files={files}
        folders={folders}
        viewMode={viewMode}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onView={(item) => handleFileAction("view", item)}
        onDownload={(item) => handleFileAction("download", item)}
        onShare={(item) => handleFileAction("share", item)}
        onRename={(item) => handleFileAction("rename", item)}
        onCopy={(item) => handleFileAction("copy", item)}
        onMove={(item) => handleFileAction("move", item)}
        onDelete={(item) => handleFileAction("delete", item)}
        onPermissions={(item) => handleFileAction("permissions", item)}
        emptyMessage={emptyMessage}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileManager;
