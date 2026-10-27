const express = require('express');
const app = express();
app.use(express.json());

// Dummy database (in memory)
const users = {};

// 1. Signup
app.post('/api/signup', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    if (users[email]) return res.status(400).json({ message: "User already exists" });
    
    users[email] = { email, password };
    
    // Log them in immediately by setting the cookie
    res.setHeader('Set-Cookie', `session=${email}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`);
    res.json({ success: true, user: { email } });
});

// 2. Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = users[email];
    
    if (user && user.password === password) {
        // The ONLY way auth is stored is in this Secure, HttpOnly cookie
        res.setHeader('Set-Cookie', `session=${email}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`);
        return res.json({ success: true, user: { email } });
    }
    
    res.status(401).json({ message: 'Invalid credentials' });
});

// 3. Get Current User (Protected)
app.get('/api/me', (req, res) => {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/session=([^;]+)/);
    
    if (match) {
        const email = match[1];
        if (users[email]) {
            return res.json({ user: { email } });
        }
    }
    res.status(401).json({ message: "Not authenticated" });
});

// 4. Logout
app.post('/api/logout', (req, res) => {
    res.setHeader('Set-Cookie', `session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
    res.json({ success: true });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`Gateway on ${PORT}`));