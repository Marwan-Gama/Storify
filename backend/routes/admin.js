const express = require("express");
const router = express.Router();

// Placeholder admin routes
router.get("/", (req, res) => {
  res.json({ message: "Admin endpoint - not implemented yet" });
});

router.get("/users", (req, res) => {
  res.json({ message: "Get users endpoint - not implemented yet" });
});

router.get("/stats", (req, res) => {
  res.json({ message: "Get stats endpoint - not implemented yet" });
});

module.exports = router;
