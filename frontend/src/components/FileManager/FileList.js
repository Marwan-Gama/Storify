import React from "react";
import { Box, Grid, Typography, Paper } from "@mui/material";
import FileItem from "./FileItem";

const FileList = ({
  files = [],
  folders = [],
  viewMode = "list",
  selectedItems = [],
  onSelectItem,
  onView,
  onDownload,
  onShare,
  onRename,
  onCopy,
  onMove,
  onDelete,
  onPermissions,
  emptyMessage = "No files or folders found",
}) => {
  const allItems = [...folders, ...files];

  if (allItems.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: "background.paper",
          borderRadius: 2,
          border: "1px dashed rgba(0,0,0,0.12)",
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          {emptyMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload files or create folders to get started
        </Typography>
      </Paper>
    );
  }

  if (viewMode === "grid") {
    return (
      <Grid container spacing={2}>
        {allItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={item.id || index}>
            <FileItem
              item={item}
              viewMode={viewMode}
              selected={selectedItems.includes(item.id || index)}
              onSelect={onSelectItem}
              onView={onView}
              onDownload={onDownload}
              onShare={onShare}
              onRename={onRename}
              onCopy={onCopy}
              onMove={onMove}
              onDelete={onDelete}
              onPermissions={onPermissions}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  // List view
  return (
    <Box>
      {folders.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "text.secondary", fontWeight: 600 }}
          >
            Folders ({folders.length})
          </Typography>
          {folders.map((folder, index) => (
            <FileItem
              key={folder.id || index}
              item={folder}
              viewMode={viewMode}
              selected={selectedItems.includes(folder.id || index)}
              onSelect={onSelectItem}
              onView={onView}
              onDownload={onDownload}
              onShare={onShare}
              onRename={onRename}
              onCopy={onCopy}
              onMove={onMove}
              onDelete={onDelete}
              onPermissions={onPermissions}
            />
          ))}
        </Box>
      )}

      {files.length > 0 && (
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "text.secondary", fontWeight: 600 }}
          >
            Files ({files.length})
          </Typography>
          {files.map((file, index) => (
            <FileItem
              key={file.id || index}
              item={file}
              viewMode={viewMode}
              selected={selectedItems.includes(file.id || index)}
              onSelect={onSelectItem}
              onView={onView}
              onDownload={onDownload}
              onShare={onShare}
              onRename={onRename}
              onCopy={onCopy}
              onMove={onMove}
              onDelete={onDelete}
              onPermissions={onPermissions}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileList;
