// mock-auth-server/index.js

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 4000;
const SECRET = 'mock-secret';
const EXPIRY = '60s';

let users = []; // our “DB”
let nextId = 1;

// Always issues a JWT signed with SECRET, expiry EXPIRY, and logs it
function signToken(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, username: user.username },
    SECRET,
    {
      expiresIn: EXPIRY,
    },
  );
  console.log(`🔑 Issued token for ${user.email}: ${token}`);
  return token;
}

// Sign up: require email+password, error if already exists
app.post('/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email & password required' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  const user = { id: nextId++, email, password };
  users.push(user);
  console.log('📋 Users in DB after signup:', users);
  const token = signToken(user);
  res.json({ token });
});

// Log in: must match email+password
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  console.log('📋 Users in DB on login:', users);
  const token = signToken(user);
  res.json({ token });
});

// Start server
app.listen(4000, '0.0.0.0', () => {
  console.log('Server listening on http://0.0.0.0:4000');
});
