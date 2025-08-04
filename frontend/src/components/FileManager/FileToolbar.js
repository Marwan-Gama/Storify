import React from "react";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
  CreateNewFolder as FolderIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";

const FileToolbar = ({
  searchQuery = "",
  onSearchChange,
  viewMode = "list",
  onViewModeChange,
  searchFilter = "all",
  onSearchFilterChange,
  searchSort = "name",
  onSearchSortChange,
  selectedCount = 0,
  onRefresh,
  onUpload,
  onCreateFolder,
  onClearSelection,
  showFilters = true,
  showViewToggle = true,
  showActions = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClearSearch = () => {
    onSearchChange("");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        gap: 2,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        mb: 3,
        flexWrap: "wrap",
      }}
    >
      {/* Search Bar */}
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* Filters and Sort */}
      {showFilters && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={searchFilter}
              onChange={(e) => onSearchFilterChange(e.target.value)}
              label="Filter"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="files">Files only</MenuItem>
              <MenuItem value="folders">Folders only</MenuItem>
              <MenuItem value="shared">Shared</MenuItem>
              <MenuItem value="recent">Recent</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={searchSort}
              onChange={(e) => onSearchSortChange(e.target.value)}
              label="Sort by"
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="size">Size</MenuItem>
              <MenuItem value="type">Type</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {/* View Mode Toggle */}
      {showViewToggle && (
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title="List view">
            <IconButton
              size="small"
              onClick={() => onViewModeChange("list")}
              color={viewMode === "list" ? "primary" : "default"}
              sx={{
                bgcolor: viewMode === "list" ? "primary.light" : "transparent",
                "&:hover": {
                  bgcolor:
                    viewMode === "list" ? "primary.light" : "action.hover",
                },
              }}
            >
              <ViewListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Grid view">
            <IconButton
              size="small"
              onClick={() => onViewModeChange("grid")}
              color={viewMode === "grid" ? "primary" : "default"}
              sx={{
                bgcolor: viewMode === "grid" ? "primary.light" : "transparent",
                "&:hover": {
                  bgcolor:
                    viewMode === "grid" ? "primary.light" : "action.hover",
                },
              }}
            >
              <ViewModuleIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Actions */}
      {showActions && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={onRefresh}
              sx={{
                bgcolor: "action.hover",
                "&:hover": { bgcolor: "action.selected" },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Upload files">
            <Button
              size="small"
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={onUpload}
              sx={{ borderRadius: 2 }}
            >
              Upload
            </Button>
          </Tooltip>

          <Tooltip title="Create folder">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={onCreateFolder}
              sx={{ borderRadius: 2 }}
            >
              New Folder
            </Button>
          </Tooltip>
        </Box>
      )}

      {/* Selection Info */}
      {selectedCount > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={`${selectedCount} selected`}
            size="small"
            color="primary"
            variant="outlined"
            onDelete={onClearSelection}
            deleteIcon={<ClearIcon />}
          />
        </Box>
      )}
    </Box>
  );
};

export default FileToolbar;
