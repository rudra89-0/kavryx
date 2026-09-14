'use strict';

const express = require('express');
const db = require('./db');
const { requireAdmin } = require('./auth');

const router = express.Router();

// Everything here requires an admin session
router.use(requireAdmin);

const DEMO_STATUSES = ['new', 'contacted', 'qualified', 'closed'];
const CONTACT_STATUSES = ['new', 'read', 'archived'];

// --- Dashboard stats ---
router.get('/stats', (req, res) => {
  const users = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const demos = db.prepare('SELECT COUNT(*) AS n FROM demo_requests').get().n;
  const messages = db.prepare('SELECT COUNT(*) AS n FROM contact_messages').get().n;
  const pending = db.prepare(
    "SELECT COUNT(*) AS n FROM demo_requests WHERE status = 'new'",
  ).get().n;
  const signups7d = db.prepare(
    "SELECT COUNT(*) AS n FROM users WHERE created_at >= datetime('now', '-7 days')",
  ).get().n;
  res.json({ users, demos, messages, pending, signups7d });
});

// --- Users ---
router.get('/users', (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.email, u.name, u.company, u.role, u.created_at, u.last_login_at,
           (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id) AS active_sessions
    FROM users u ORDER BY u.created_at DESC
  `).all();
  res.json({ users: rows });
});

router.patch('/users/:id/role', (req, res) => {
  const { role } = req.body || {};
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
  const info = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'User not found.' });
  res.json({ ok: true });
});

router.delete('/users/:id', (req, res) => {
  if (req.user.id === Number(req.params.id)) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'User not found.' });
  res.json({ ok: true });
});

// --- Demo requests ---
router.get('/demo-requests', (req, res) => {
  const rows = db.prepare('SELECT * FROM demo_requests ORDER BY created_at DESC').all();
  res.json({ requests: rows });
});

router.patch('/demo-requests/:id', (req, res) => {
  const { status } = req.body || {};
  if (!DEMO_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${DEMO_STATUSES.join(', ')}` });
  }
  const info = db.prepare(
    "UPDATE demo_requests SET status = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Request not found.' });
  res.json({ ok: true });
});

router.delete('/demo-requests/:id', (req, res) => {
  const info = db.prepare('DELETE FROM demo_requests WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Request not found.' });
  res.json({ ok: true });
});

// --- Contact messages ---
router.get('/contact-messages', (req, res) => {
  const rows = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json({ messages: rows });
});

router.patch('/contact-messages/:id', (req, res) => {
  const { status } = req.body || {};
  if (!CONTACT_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${CONTACT_STATUSES.join(', ')}` });
  }
  const info = db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Message not found.' });
  res.json({ ok: true });
});

router.delete('/contact-messages/:id', (req, res) => {
  const info = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Message not found.' });
  res.json({ ok: true });
});

module.exports = router;
