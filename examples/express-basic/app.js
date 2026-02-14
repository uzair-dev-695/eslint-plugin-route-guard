const express = require('express');
const app = express();

// Valid: unique routes
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users', (req, res) => {
  res.status(201).json({ id: 1 });
});

// ERROR: Duplicate GET /users route
app.get('/users', (req, res) => {
  res.json({ duplicate: true });
});

app.listen(3000);
