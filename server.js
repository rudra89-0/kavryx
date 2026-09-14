'use strict';

const path = require('path');
const express = require('express');
const db = require('./src/db');
const { sessionMiddleware } = require('./src/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Attach req.user from session cookie before routing
app.use(sessionMiddleware(db));

// Never cache HTML so UI updates are always picked up on refresh
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// --- API routes ---
app.use('/api/auth', require('./src/routes-auth'));
app.use('/api', require('./src/routes-public'));
app.use('/api/admin', require('./src/routes-admin'));

// --- Static frontend ---
app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

// JSON 404 for unknown API paths, index.html for everything else
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Central error handler — always JSON for API calls
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const server = app.listen(PORT, () => {
  console.log(`Kavryx Dev backend running → http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or run: PORT=3001 npm start`);
    process.exit(1);
  }
  throw err;
});
