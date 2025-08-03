import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Badge,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";

const Header = ({
  onDrawerToggle,
  currentPath,
  user,
  userData,
  sidebarCollapsed,
  drawerWidth = 280,
  collapsedDrawerWidth = 70,
  onNavigation,
  onLogout,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null);

  const currentDrawerWidth = sidebarCollapsed
    ? collapsedDrawerWidth
    : drawerWidth;

  // Sample notifications - replace with real data
  const notifications = [
    {
      id: 1,
      title: "File uploaded successfully",
      message: "document.pdf has been uploaded to your storage",
      type: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
    },
    {
      id: 2,
      title: "Storage warning",
      message: "You are using 85% of your storage space",
      type: "warning",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
    },
  ];

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const displayName = userData?.name || user?.name || "User";
  const displayEmail = userData?.email || user?.email || "user@example.com";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getPageTitle = () => {
    const pageTitles = {
      "/dashboard": "Dashboard",
      "/files": "My Files",
      "/shared": "Shared Files",
      "/trash": "Trash",
      "/profile": "Profile",
      "/admin": "Admin Panel",
      "/settings": "Settings",
    };
    return pageTitles[currentPath] || "Storify";
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon color="success" />;
      case "error":
        return <ErrorIcon color="error" />;
      case "warning":
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMoreMenuOpen = (event) => {
    setMoreMenuAnchorEl(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout?.();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${currentDrawerWidth}px - 32px)` },
        background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: "width 0.3s ease, left 0.3s ease",
        left: { xs: 0, md: `${currentDrawerWidth + 8}px` },
        right: { xs: 0, md: 8 },
        borderRadius: { xs: 0, md: "8px" },
        mt: { xs: 0, md: 1 },
        mx: { xs: 0, md: 1 },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, fontWeight: 600, color: "white" }}
        >
          {getPageTitle()}
        </Typography>

        {/* Search */}
        <Tooltip title="Search">
          <IconButton
            color="inherit"
            onClick={() => onNavigation("/search")}
            sx={{ mr: 1 }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadNotifications} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* More Options */}
        <Tooltip title="More options">
          <IconButton
            color="inherit"
            onClick={handleMoreMenuOpen}
            sx={{ mr: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Tooltip title="Account settings">
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "rgba(255,255,255,0.2)",
                fontSize: "1rem",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              {userInitials}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* User Menu */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.04)",
            },
          }}
        >
          {/* User Info */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              {displayEmail}
            </Typography>
            <Chip
              label={`${userData?.tier || user?.tier || "free"} tier`}
              size="small"
              color={
                userData?.tier === "premium" || user?.tier === "premium"
                  ? "success"
                  : "default"
              }
              sx={{ fontSize: "0.7rem" }}
            />
          </Box>

          <MenuItem
            onClick={() => {
              onNavigation("/profile");
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <ProfileIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>

          <MenuItem
            onClick={() => {
              onNavigation("/settings");
              handleMenuClose();
            }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Settings
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 350,
              maxHeight: 400,
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.04)",
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  // Mark all as read
                  handleNotificationClose();
                }}
              >
                <CheckCircleIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ maxHeight: 300, overflow: "auto" }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">No notifications</Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: notification.read ? "transparent" : "action.hover",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      width: "100%",
                    }}
                  >
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.read ? 400 : 600,
                          mb: 0.5,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1, lineHeight: 1.4 }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <ScheduleIcon sx={{ fontSize: 14 }} />
                        {formatTimeAgo(notification.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Box>
        </Menu>

        {/* More Options Menu */}
        <Menu
          anchorEl={moreMenuAnchorEl}
          open={Boolean(moreMenuAnchorEl)}
          onClose={handleMoreMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: 2,
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              border: "1px solid rgba(0,0,0,0.04)",
            },
          }}
        >
          <MenuItem
            onClick={() => {
              onNavigation("/upload");
              handleMoreMenuClose();
            }}
          >
            <ListItemIcon>
              <SearchIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Upload Files</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              onNavigation("/create-folder");
              handleMoreMenuClose();
            }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Folder</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
