import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

const Trash = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trash
      </Typography>

      <Paper sx={{ p: 4, textAlign: "center" }}>
        <DeleteIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No items in trash
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Deleted files and folders will appear here
        </Typography>
      </Paper>
    </Box>
  );
};

export default Trash;
