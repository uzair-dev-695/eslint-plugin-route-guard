const express = require('express');
const router = express.Router();

// Valid routes
router.get('/users', (req, res) => {
  res.json({ admin: true });
});

// ERROR: Duplicate GET /admin/users
router.get('/users', (req, res) => {
  res.json({ duplicate: true });
});

module.exports = router;
