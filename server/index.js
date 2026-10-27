const express = require('express');
const app = express();
app.use(express.json());

// 1. Prove cookie round-trip
app.get('/api/whoami', (req, res) => {
  const session = req.headers.cookie?.split('session=')[1]?.split(';')[0];
  if (!session) {
    // First visit: set a test cookie
    res.setHeader('Set-Cookie', 'session=test123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600');
    return res.json({ authenticated: false, message: 'Cookie set, refresh or call again' });
  }
  res.json({ authenticated: true, session });
});

// 2. Login sets HttpOnly cookie (dummy validation)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'test@test.com' && password === 'password') {
    res.setHeader('Set-Cookie', 'session=real-session-abc; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600');
    return res.json({ success: true, message: 'Logged in' }); // NO token in body
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// 3. Logout clears cookie
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  res.json({ success: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Gateway on ${PORT}`));