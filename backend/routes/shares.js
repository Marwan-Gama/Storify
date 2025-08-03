const express = require("express");
const router = express.Router();

// Placeholder share routes
router.get("/", (req, res) => {
  res.json({ message: "Shares endpoint - not implemented yet" });
});

router.post("/", (req, res) => {
  res.json({ message: "Create share endpoint - not implemented yet" });
});

router.get("/:id", (req, res) => {
  res.json({ message: "Get share endpoint - not implemented yet" });
});

router.put("/:id", (req, res) => {
  res.json({ message: "Update share endpoint - not implemented yet" });
});

router.delete("/:id", (req, res) => {
  res.json({ message: "Delete share endpoint - not implemented yet" });
});

module.exports = router;
