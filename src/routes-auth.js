'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const {
  createSession, setSessionCookie, clearSessionCookie,
} = require('./auth');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_ERR = 'Please enter a valid email address.';

// First registered user becomes admin automatically
function isFirstUser() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0;
}

router.post('/register', (req, res) => {
  const { email, password, name, company } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: EMAIL_ERR });
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required.' });

  const hash = bcrypt.hashSync(password, 12);
  try {
    const role = isFirstUser() ? 'admin' : 'user';
    const info = db.prepare(`
      INSERT INTO users (email, password_hash, name, company, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(email.trim(), hash, name.trim(), company ? company.trim() : null, role);

    const token = createSession(db, info.lastInsertRowid, req);
    setSessionCookie(res, token);
    const user = db.prepare('SELECT id, email, name, company, role FROM users WHERE id = ?')
      .get(info.lastInsertRowid);
    res.status(201).json({ user });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    throw err;
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  db.prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?').run(user.id);
  const token = createSession(db, user.id, req);
  setSessionCookie(res, token);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, company: user.company, role: user.role },
  });
});

router.post('/logout', (req, res) => {
  if (req.sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
  }
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });
  res.json({ user: req.user });
});

module.exports = router;
