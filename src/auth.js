'use strict';

const crypto = require('crypto');

const SESSION_TTL_HOURS = 24 * 7; // 7 days

function createSession(db, userId, req) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, user_agent, ip)
    VALUES (?, ?, datetime('now', '+' || ? || ' hours'), ?, ?)
  `).run(token, userId, SESSION_TTL_HOURS, req.get('user-agent') || null, req.ip || null);
  return token;
}

// Attaches req.user when a valid session cookie is present
function sessionMiddleware(db) {
  return (req, res, next) => {
    const token = parseCookie(req.headers.cookie || '').sid;
    if (!token) return next();

    const row = db.prepare(`
      SELECT s.id AS session_id, s.expires_at, u.id, u.email, u.name, u.company, u.role
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `).get(token);

    if (!row) return next();
    req.user = { id: row.id, email: row.email, name: row.name, company: row.company, role: row.role };
    req.sessionId = row.session_id;
    next();
  };
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

// API-only guard: 401 when not logged in, 403 when not an admin
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function parseCookie(header) {
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie',
    `sid=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_HOURS * 3600}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
}

module.exports = {
  SESSION_TTL_HOURS,
  createSession,
  sessionMiddleware,
  requireAuth,
  requireAdmin,
  parseCookie,
  setSessionCookie,
  clearSessionCookie,
};
