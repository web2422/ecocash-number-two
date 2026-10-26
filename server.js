const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Database = require('better-sqlite3');
const crypto = require('node:crypto');
const path = require('node:path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const db = new Database(process.env.DB_FILE || path.join(__dirname, 'ecocash-number-two.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  pin_salt TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false }));

const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('263')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^7\d{8}$/.test(digits)) return null;
  return `+263${digits}`;
};
const hashPin = (pin, salt) => crypto.scryptSync(pin, salt, 64).toString('hex');
const validPin = (pin) => /^\d{4,6}$/.test(String(pin || ''));

app.post('/api/register', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const pin = String(req.body.pin || '');
  if (!phone) return res.status(400).json({ error: 'Enter a valid Zimbabwe mobile number.' });
  if (!validPin(pin)) return res.status(400).json({ error: 'Choose a PIN with 4–6 digits.' });
  const salt = crypto.randomBytes(16).toString('hex');
  try {
    const info = db.prepare('INSERT INTO users (phone, pin_salt, pin_hash) VALUES (?, ?, ?)').run(phone, salt, hashPin(pin, salt));
    return res.status(201).json({ ok: true, message: 'Account created. You can now log in.', userId: info.lastInsertRowid });
  } catch (err) {
    if (String(err.code).includes('CONSTRAINT')) return res.status(409).json({ error: 'An account already exists for this phone number.' });
    console.error(err); return res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/login', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  const pin = String(req.body.pin || '');
  if (!phone || !validPin(pin)) return res.status(400).json({ error: 'Enter your Zimbabwe phone number and PIN.' });
  const user = db.prepare('SELECT id, pin_salt, pin_hash FROM users WHERE phone = ?').get(phone);
  if (!user) return res.status(401).json({ error: 'Phone number or PIN is incorrect.' });
  const supplied = Buffer.from(hashPin(pin, user.pin_salt), 'hex');
  const expected = Buffer.from(user.pin_hash, 'hex');
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: 'Phone number or PIN is incorrect.' });
  }
  // This starter intentionally does not issue a persistent session yet.
  return res.json({ ok: true, message: 'Login successful. Session management is the next setup step.' });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`EcoCash Number Two school project running on http://localhost:${PORT}`));
