'use strict';

const express = require('express');
const db = require('./db');
const { requireAuth } = require('./auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Demo requests ---
router.post('/demo-requests', (req, res) => {
  const { name, email, company, teamSize, message } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

  const info = db.prepare(`
    INSERT INTO demo_requests (user_id, name, email, company, team_size, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    req.user ? req.user.id : null,
    name.trim(),
    email.trim(),
    company ? company.trim() : null,
    teamSize ? String(teamSize).trim() : null,
    message ? String(message).trim() : null,
  );
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

// A logged-in user can see their own requests
router.get('/demo-requests/mine', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM demo_requests WHERE user_id = ? ORDER BY created_at DESC',
  ).all(req.user.id);
  res.json({ requests: rows });
});

// --- Contact messages ---
router.post('/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required.' });

  const info = db.prepare(`
    INSERT INTO contact_messages (user_id, name, email, message)
    VALUES (?, ?, ?, ?)
  `).run(req.user ? req.user.id : null, name.trim(), email.trim(), message.trim());
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.get('/contact/mine', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM contact_messages WHERE user_id = ? ORDER BY created_at DESC',
  ).all(req.user.id);
  res.json({ messages: rows });
});

module.exports = router;
