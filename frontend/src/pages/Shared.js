import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { Share as ShareIcon } from "@mui/icons-material";

const Shared = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Shared Files
      </Typography>

      <Paper sx={{ p: 4, textAlign: "center" }}>
        <ShareIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No shared files
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Files shared with you will appear here
        </Typography>
      </Paper>
    </Box>
  );
};

export default Shared;
