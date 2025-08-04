import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Chip,
  Avatar,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Folder as FolderIcon,
  Cloud as CloudIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  DriveFileMove as MoveIcon,
  DriveFileRenameOutline as RenameIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  GetApp as DownloadIcon2,
} from "@mui/icons-material";

const FileItem = ({
  item,
  onView,
  onDownload,
  onShare,
  onRename,
  onCopy,
  onMove,
  onDelete,
  onPermissions,
  viewMode = "list",
  selected = false,
  onSelect,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleAction = (action) => {
    handleMenuClose();
    switch (action) {
      case "view":
        onView?.(item);
        break;
      case "download":
        onDownload?.(item);
        break;
      case "share":
        onShare?.(item);
        break;
      case "rename":
        onRename?.(item);
        break;
      case "copy":
        onCopy?.(item);
        break;
      case "move":
        onMove?.(item);
        break;
      case "delete":
        onDelete?.(item);
        break;
      case "permissions":
        onPermissions?.(item);
        break;
      default:
        break;
    }
  };

  const getFileIcon = (item) => {
    if (item.type === "folder") {
      return <FolderIcon sx={{ color: "primary.main" }} />;
    }

    // You can expand this to handle different file types
    return <CloudIcon sx={{ color: "text.secondary" }} />;
  };

  const isListView = viewMode === "list";

  if (isListView) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: 2,
          mb: 1,
          borderRadius: 2,
          bgcolor: selected ? "action.selected" : "background.paper",
          border: selected ? "2px solid" : "1px solid",
          borderColor: selected ? "primary.main" : "rgba(0,0,0,0.08)",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            bgcolor: "action.hover",
            transform: "translateY(-1px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          },
        }}
        onClick={() => onSelect?.(item)}
        onDoubleClick={() => onView?.(item)}
      >
        <Box sx={{ mr: 2, display: "flex", alignItems: "center" }}>
          {getFileIcon(item)}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              mb: 0.5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {item.size || "0 KB"}
            </Typography>
            {item.shared && (
              <Chip
                label="Shared"
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            )}
            {item.isPublic && (
              <Chip
                label="Public"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="More options">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                opacity: 0.7,
                "&:hover": { opacity: 1 },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              minWidth: 180,
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.04)",
            },
          }}
        >
          <MenuItem onClick={() => handleAction("view")}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View</ListItemText>
          </MenuItem>

          {item.type !== "folder" && (
            <MenuItem onClick={() => handleAction("download")}>
              <ListItemIcon>
                <DownloadIcon2 fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
          )}

          <MenuItem onClick={() => handleAction("share")}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleAction("rename")}>
            <ListItemIcon>
              <RenameIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleAction("copy")}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copy</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleAction("move")}>
            <ListItemIcon>
              <MoveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Move</ListItemText>
          </MenuItem>

          <MenuItem onClick={() => handleAction("permissions")}>
            <ListItemIcon>
              <LockIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Permissions</ListItemText>
          </MenuItem>

          <MenuItem
            onClick={() => handleAction("delete")}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  // Grid view
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 2,
        borderRadius: 2,
        bgcolor: selected ? "action.selected" : "background.paper",
        border: selected ? "2px solid" : "1px solid",
        borderColor: selected ? "primary.main" : "rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        minHeight: 120,
        "&:hover": {
          bgcolor: "action.hover",
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
      }}
      onClick={() => onSelect?.(item)}
      onDoubleClick={() => onView?.(item)}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: item.type === "folder" ? "primary.light" : "grey.100",
            color: item.type === "folder" ? "primary.main" : "text.secondary",
          }}
        >
          {getFileIcon(item)}
        </Avatar>

        <Tooltip title="More options">
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              opacity: 0.7,
              "&:hover": { opacity: 1 },
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            mb: 0.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 1 }}
        >
          {item.size || "0 KB"}
        </Typography>

        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {item.shared && (
            <Chip
              label="Shared"
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.6rem" }}
            />
          )}
          {item.isPublic && (
            <Chip
              label="Public"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ height: 20, fontSize: "0.6rem" }}
            />
          )}
        </Box>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            border: "1px solid rgba(0,0,0,0.04)",
          },
        }}
      >
        <MenuItem onClick={() => handleAction("view")}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>

        {item.type !== "folder" && (
          <MenuItem onClick={() => handleAction("download")}>
            <ListItemIcon>
              <DownloadIcon2 fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => handleAction("share")}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction("rename")}>
          <ListItemIcon>
            <RenameIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction("copy")}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction("move")}>
          <ListItemIcon>
            <MoveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Move</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleAction("permissions")}>
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Permissions</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => handleAction("delete")}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FileItem;
