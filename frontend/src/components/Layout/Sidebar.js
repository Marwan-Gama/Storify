import React from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Badge,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Delete as TrashIcon,
  Share as ShareIcon,
  Person as ProfileIcon,
  AdminPanelSettings as AdminIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";

const Sidebar = ({
  mobileOpen,
  onDrawerToggle,
  sidebarCollapsed,
  onToggleSidebar,
  currentPath,
  onNavigation,
  user,
  userData,
  drawerWidth = 280,
  collapsedDrawerWidth = 70,
}) => {
  const theme = useTheme();
  // Remove unused variable: const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleDrawerToggle = () => {
    onDrawerToggle();
  };

  const menuItems = [
    {
      text: "Dashboard",
      path: "/dashboard",
      icon: <DashboardIcon />,
    },
    {
      text: "My Files",
      path: "/files",
      icon: <FolderIcon />,
    },
    {
      text: "Shared",
      path: "/shared",
      icon: <ShareIcon />,
      badge: 3,
    },
    {
      text: "Trash",
      path: "/trash",
      icon: <TrashIcon />,
    },
    {
      text: "Profile",
      path: "/profile",
      icon: <ProfileIcon />,
    },
    ...(user?.role === "admin"
      ? [
          {
            text: "Admin",
            path: "/admin",
            icon: <AdminIcon />,
          },
        ]
      : []),
    {
      text: "Settings",
      path: "/settings",
      icon: <SettingsIcon />,
    },
  ];

  const getStorageUsagePercentage = () => {
    if (!userData) return 0;
    const used = userData.storageUsed || 0;
    const total = userData.storageLimit || 1;
    return Math.round((used / total) * 100);
  };

  const displayName = userData?.name || user?.name || "User";
  const displayEmail = userData?.email || user?.email || "user@example.com";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const currentDrawerWidth = sidebarCollapsed
    ? collapsedDrawerWidth
    : drawerWidth;

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: sidebarCollapsed ? 2 : 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          borderRadius: 0,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>
          {/* User Avatar and Info */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: sidebarCollapsed ? 0 : 2,
            }}
          >
            <Avatar
              sx={{
                width: sidebarCollapsed ? 40 : 50,
                height: sidebarCollapsed ? 40 : 50,
                mr: sidebarCollapsed ? 0 : 2,
                bgcolor: "rgba(255,255,255,0.2)",
                fontSize: sidebarCollapsed ? "1rem" : "1.2rem",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            >
              {userInitials}
            </Avatar>
            {!sidebarCollapsed && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    mb: 0.5,
                    fontSize: "1rem",
                  }}
                  noWrap
                >
                  {displayName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    opacity: 0.9,
                    fontSize: "0.8rem",
                  }}
                  noWrap
                >
                  {displayEmail}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Storage Info */}
          {!sidebarCollapsed && (
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.9, fontWeight: 500 }}
                >
                  Storage
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.9, fontWeight: 600 }}
                >
                  {getStorageUsagePercentage()}%
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  height: 4,
                  bgcolor: "rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${getStorageUsagePercentage()}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%)",
                    transition: "width 0.5s ease",
                    borderRadius: 2,
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Navigation Menu */}
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <List sx={{ pt: 2, pb: 2, px: 1 }}>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => onNavigation(item.path)}
                selected={currentPath === item.path}
                sx={{
                  mx: sidebarCollapsed ? 0.5 : 1.5,
                  mb: 0.5,
                  borderRadius: 2,
                  minHeight: 48,
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s ease-in-out",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                    "&:hover": {
                      bgcolor: "primary.dark",
                      transform: "translateX(4px)",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                    "& .MuiListItemText-primary": {
                      fontWeight: 600,
                    },
                  },
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "translateX(4px)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarCollapsed ? 40 : 44,
                    mr: sidebarCollapsed ? 0 : 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!sidebarCollapsed && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: currentPath === item.path ? 600 : 500,
                      lineHeight: 1.2,
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      "& .MuiListItemText-primary": {
                        display: "flex",
                        alignItems: "center",
                      },
                    }}
                  />
                )}
                {!sidebarCollapsed && item.badge && (
                  <Badge
                    badgeContent={item.badge}
                    color="error"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      "& .MuiBadge-badge": {
                        fontSize: "0.7rem",
                        height: 18,
                        minWidth: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: sidebarCollapsed ? 1 : 2,
            borderTop: "1px solid rgba(0,0,0,0.08)",
            bgcolor: "background.paper",
            flexShrink: 0,
            mt: "auto",
          }}
        >
          {!sidebarCollapsed && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              Storify v1.0
            </Typography>
          )}

          {/* Collapse/Expand Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: sidebarCollapsed ? 0 : 1,
            }}
          >
            <IconButton
              size="small"
              onClick={onToggleSidebar}
              sx={{
                bgcolor: "action.hover",
                "&:hover": {
                  bgcolor: "action.selected",
                },
              }}
            >
              {sidebarCollapsed ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: currentDrawerWidth },
        flexShrink: { md: 0 },
        height: "100vh",
        mr: { xs: 0, md: 1 },
      }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            height: "100vh",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: currentDrawerWidth,
            height: "100vh",
            borderRight: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "2px 0px 8px rgba(0,0,0,0.08)",
            transition: "width 0.3s ease",
            overflow: "hidden",
            borderRadius: 0,
            mt: 1,
            mb: 1,
            bgcolor: "background.paper",
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
