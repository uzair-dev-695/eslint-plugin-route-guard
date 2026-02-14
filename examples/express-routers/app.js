const express = require('express');
const adminRouter = require('./admin-router');
const app = express();

// Main app routes
app.get('/', (req, res) => {
  res.send('Home');
});

// Mount router with prefix
app.use('/admin', adminRouter);

app.listen(3000);
