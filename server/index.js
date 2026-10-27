const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '../public')));

// In-memory session store (In production, this would be Redis or a Supabase DB)
const sessions = {};

// Helper to set cookies securely based on environment
const getCookieString = (name, value, maxAge) => {
    const isProd = process.env.NODE_ENV === 'production';
    // Secure is required in production (HTTPS), omitted for localhost HTTP testing
    const secureFlag = isProd ? 'Secure;' : ''; 
    return `${name}=${value}; HttpOnly; ${secureFlag} SameSite=Strict; Path=/; Max-Age=${maxAge}`;
};

// ---------------------------------------------------------
// 1. LOGIN (Issues Session HttpOnly Cookie + CSRF Token)
// ---------------------------------------------------------
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    // Verify credentials (Hardcoded for the practice as requested)
    if (email === 'App' && password === '123') {
        // Generate a secure random session token and CSRF token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const csrfToken = crypto.randomBytes(32).toString('hex');
        
        // Store session in backend (mapped to CSRF token)
        sessions[sessionToken] = { email, csrfToken };

        // Set Session Cookie (HttpOnly - JS cannot read this)
        res.setHeader('Set-Cookie', [
            getCookieString('session_token', sessionToken, 3600),
            // Set CSRF Cookie (NOT HttpOnly - JS needs to read this to send it in headers)
            `csrf_token=${csrfToken}; SameSite=Strict; Path=/; Max-Age=3600` 
        ]);

        // Never return the session token in the JSON body!
        return res.json({ success: true, user: { email } });
    }
    
    res.status(401).json({ message: 'Invalid credentials. Use App / 123' });
});

// ---------------------------------------------------------
// 2. GET CURRENT USER (Validates HttpOnly Cookie)
// ---------------------------------------------------------
app.get('/api/me', (req, res) => {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/session_token=([^;]+)/);
    
    if (match && sessions[match[1]]) {
        // Return user data without any tokens
        return res.json({ user: { email: sessions[match[1]].email } });
    }
    
    res.status(401).json({ message: "Not authenticated" });
});

// ---------------------------------------------------------
// 3. CSRF PROTECTED ACTION (Example Endpoint)
// ---------------------------------------------------------
app.post('/api/protected-action', (req, res) => {
    const cookies = req.headers.cookie || '';
    const sessionMatch = cookies.match(/session_token=([^;]+)/);
    const csrfHeader = req.headers['x-csrf-token'];

    // 1. Check Auth
    if (!sessionMatch || !sessions[sessionMatch[1]]) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const session = sessions[sessionMatch[1]];

    // 2. Check CSRF (Header must match what is stored in the session)
    if (!csrfHeader || csrfHeader !== session.csrfToken) {
        return res.status(403).json({ message: "CSRF validation failed" });
    }

    // Action is safe to perform
    res.json({ success: true, message: "CSRF token validated. Action performed successfully." });
});

// ---------------------------------------------------------
// 4. LOGOUT (Destroys Cookies)
// ---------------------------------------------------------
app.post('/api/logout', (req, res) => {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/session_token=([^;]+)/);

    // Delete from backend memory
    if (match && sessions[match[1]]) {
        delete sessions[match[1]];
    }

    // Clear cookies in browser (Max-Age=0)
    res.setHeader('Set-Cookie', [
        getCookieString('session_token', '', 0),
        `csrf_token=; SameSite=Strict; Path=/; Max-Age=0`
    ]);
    
    res.json({ success: true });
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure Gateway running on http://localhost:${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});