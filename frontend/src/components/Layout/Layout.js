import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

const drawerWidth = 280;
const collapsedDrawerWidth = 70;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Layout: User from AuthContext:", user); // Debug log

        // Use actual user data from AuthContext and enhance it with additional info
        if (user) {
          const enhancedUserData = {
            name: user.name || user.username || "User",
            email: user.email || "user@example.com",
            tier: user.tier || user.role || "free",
            storageUsed: user.storageUsed || 2.5 * 1024 * 1024 * 1024, // 2.5 GB
            storageLimit: user.storageLimit || 5 * 1024 * 1024 * 1024, // 5 GB
            // Add any additional user properties
            ...user,
          };
          console.log("Layout: Enhanced user data:", enhancedUserData); // Debug log
          setUserData(enhancedUserData);
        } else {
          console.log("Layout: No user data available"); // Debug log
          setUserData(null);
        }
      } catch (error) {
        console.error("Error processing user data:", error);
        setUserData(null);
      }
    };

    fetchUserData();
  }, [user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const currentDrawerWidth = sidebarCollapsed
    ? collapsedDrawerWidth
    : drawerWidth;

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        bgcolor: { xs: "background.default", md: "grey.50" },
      }}
    >
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        currentPath={location.pathname}
        onNavigation={handleNavigation}
        user={user}
        userData={userData}
        drawerWidth={drawerWidth}
        collapsedDrawerWidth={collapsedDrawerWidth}
      />

      {/* Header */}
      <Header
        onDrawerToggle={handleDrawerToggle}
        currentPath={location.pathname}
        user={user}
        userData={userData}
        sidebarCollapsed={sidebarCollapsed}
        drawerWidth={drawerWidth}
        collapsedDrawerWidth={collapsedDrawerWidth}
        onNavigation={handleNavigation}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px - 32px)` },
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          transition: "width 0.3s ease",
          ml: { xs: 0, md: 1 },
          borderRadius: { xs: 0, md: "8px" },
          mt: { xs: 0, md: 1 },
          mb: { xs: 0, md: 1 },
          boxShadow: { xs: "none", md: "0 2px 8px rgba(0,0,0,0.1)" },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 2, md: 3 },
          }}
          className="content-scroll"
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
