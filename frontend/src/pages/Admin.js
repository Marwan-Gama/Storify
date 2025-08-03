import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Block as BlockIcon,
  CheckCircle as ApproveIcon,
} from "@mui/icons-material";

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API calls
      // For now, using mock data
      setUsers([
        {
          id: 1,
          email: "user1@example.com",
          name: "John Doe",
          role: "user",
          status: "active",
          createdAt: "2024-01-15",
          storageUsed: "2.5 GB",
        },
        {
          id: 2,
          email: "user2@example.com",
          name: "Jane Smith",
          role: "user",
          status: "active",
          createdAt: "2024-01-20",
          storageUsed: "1.8 GB",
        },
      ]);

      setFiles([
        {
          id: 1,
          name: "document.pdf",
          owner: "user1@example.com",
          size: "2.5 MB",
          type: "pdf",
          createdAt: "2024-01-25",
          status: "active",
        },
        {
          id: 2,
          name: "image.jpg",
          owner: "user2@example.com",
          size: "1.2 MB",
          type: "image",
          createdAt: "2024-01-26",
          status: "active",
        },
      ]);

      setStats({
        totalUsers: 2,
        totalFiles: 2,
        totalStorage: "4.3 GB",
        activeUsers: 2,
      });
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (userId, action) => {
    // TODO: Implement user actions
    console.log(`Action ${action} on user ${userId}`);
  };

  const handleFileAction = (fileId, action) => {
    // TODO: Implement file actions
    console.log(`Action ${action} on file ${fileId}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <Typography>Loading admin data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">{stats.totalUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Files
              </Typography>
              <Typography variant="h4">{stats.totalFiles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Storage
              </Typography>
              <Typography variant="h4">{stats.totalStorage}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4">{stats.activeUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Users Management
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Storage Used</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    color={getStatusColor(user.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{user.storageUsed}</TableCell>
                <TableCell>{user.createdAt}</TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleUserAction(user.id, "view")}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit User">
                    <IconButton
                      size="small"
                      onClick={() => handleUserAction(user.id, "edit")}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Block User">
                    <IconButton
                      size="small"
                      onClick={() => handleUserAction(user.id, "block")}
                    >
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete User">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleUserAction(user.id, "delete")}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Files Table */}
      <Typography variant="h5" gutterBottom>
        Files Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File Name</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.owner}</TableCell>
                <TableCell>
                  <Chip label={file.type} size="small" />
                </TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>
                  <Chip
                    label={file.status}
                    color={getStatusColor(file.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{file.createdAt}</TableCell>
                <TableCell>
                  <Tooltip title="View File">
                    <IconButton
                      size="small"
                      onClick={() => handleFileAction(file.id, "view")}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Approve File">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleFileAction(file.id, "approve")}
                    >
                      <ApproveIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete File">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleFileAction(file.id, "delete")}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Admin;
